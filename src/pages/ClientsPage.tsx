import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import ClientDialog from '@/components/ClientDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useClients } from '@/hooks/useClients';
import type { Client } from '@/lib/data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function ClientsPage() {
  const { clients, loading, createClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client =>
    client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (clientData: Omit<Client, 'id' | 'totalVisits' | 'lastVisit'> & { id?: string }) => {
    try {
      if (clientData.id) {
        // Edit existing - пока не реализовано в хуке
        toast.info('Редактирование клиентов пока не реализовано');
      } else {
        // Create new
        await createClient(clientData);
        toast.success('Клиент добавлен');
      }
      setEditingClient(null);
      setDialogOpen(false);
    } catch (error) {
      toast.error('Ошибка при сохранении клиента');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingClient) {
      // Удаление пока не реализовано в хуке
      toast.info('Удаление клиентов пока не реализовано');
      setDeletingClient(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  return (
    <div>
      <Topbar title="Клиенты" />
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
      <div className="p-6">
        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Поиск по имени или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" /> Фильтр
          </button>
          <button 
            onClick={handleAddNew}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>

        {/* Client table */}
        <motion.div variants={container} initial="hidden" animate="show" className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Клиент</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Телефон</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Последний визит</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Визитов</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <motion.tr
                  key={client.id}
                  variants={item}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold">
                        {client.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-foreground">{client.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{client.phone}</td>
                  <td className="p-4 text-sm text-muted-foreground">{client.lastVisit || '—'}</td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground">{client.totalVisits}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(client)}
                        className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(client)}
                        className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchQuery ? 'Клиенты не найдены' : 'Нет клиентов'}
            </div>
          )}
        </motion.div>
      </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить клиента "{deletingClient?.fullName}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
