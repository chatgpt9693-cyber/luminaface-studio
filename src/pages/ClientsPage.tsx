import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, User, Gift, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import ClientDialog from '@/components/ClientDialog';
import ClientFilters, { ClientFilterOptions } from '@/components/ClientFilters';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useClients } from '@/hooks/useClients';
import { useIsMobile } from '@/hooks/use-mobile';
import { CLIENT_TAGS } from '@/lib/clientExtensions';
import type { Client } from '@/lib/data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function ClientsPage() {
  const isMobile = useIsMobile();
  const { clients, loading, createClient, updateClient, deleteClient } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [filters, setFilters] = useState<ClientFilterOptions>({
    tags: [],
    sortBy: 'name',
    sortOrder: 'asc',
    hasDiscount: null,
  });

  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter(client => {
      // Поиск
      const matchesSearch = 
        client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Фильтр по тегам
      const clientTags = (client as any).tags || [];
      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => clientTags.includes(tag));
        if (!hasTag) return false;
      }

      // Фильтр по скидке
      if (filters.hasDiscount !== null) {
        const hasDiscount = ((client as any).discount || 0) > 0;
        if (hasDiscount !== filters.hasDiscount) return false;
      }

      return true;
    });

    // Сортировка
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'visits':
          comparison = a.totalVisits - b.totalVisits;
          break;
        case 'lastVisit':
          const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
          const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'totalSpent':
          const spentA = (a as any).totalSpent || 0;
          const spentB = (b as any).totalSpent || 0;
          comparison = spentA - spentB;
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [clients, searchQuery, filters]);

  const handleSave = async (clientData: Omit<Client, 'id' | 'totalVisits' | 'lastVisit'> & { id?: string }) => {
    try {
      if (clientData.id) {
        // Edit existing
        await updateClient(clientData.id, clientData);
        toast.success('Клиент обновлён');
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

  const handleDeleteConfirm = async () => {
    if (deletingClient) {
      try {
        await deleteClient(deletingClient.id);
        toast.success('Клиент удалён');
        setDeletingClient(null);
        setDeleteDialogOpen(false);
      } catch (error) {
        toast.error('Ошибка при удалении клиента');
      }
    }
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  // Mobile view
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Topbar title="Клиенты" />
        <div className="pt-14 pb-4 px-4 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button 
              onClick={handleAddNew}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredAndSortedClients.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Клиенты не найдены' : 'Нет клиентов'}
              </p>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
              {filteredAndSortedClients.map(client => {
                const clientTags = (client as any).tags || [];
                const discount = (client as any).discount || 0;
                
                return (
                  <motion.div
                    key={client.id}
                    variants={item}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                        {client.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-foreground">{client.fullName}</h3>
                          {discount > 0 && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
                              <Gift className="w-3 h-3 mr-1" />
                              -{discount}%
                            </Badge>
                          )}
                        </div>
                        {clientTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {clientTags.map((tag: string) => {
                              const tagInfo = CLIENT_TAGS.find(t => t.value === tag);
                              return tagInfo ? (
                                <Badge key={tag} variant="outline" className={`text-xs ${tagInfo.color}`}>
                                  {tagInfo.label}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mb-1">{client.phone}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Визитов: <span className="text-primary font-medium">{client.totalVisits}</span>
                          </span>
                          {client.lastVisit && (
                            <span className="text-xs text-muted-foreground">
                              Последний: {new Date(client.lastVisit).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleEdit(client)}
                          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(client)}
                          className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

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

  // Desktop view

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
              placeholder="Поиск по имени, телефону или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <ClientFilters filters={filters} onFiltersChange={setFilters} />
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
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Контакты</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Статистика</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Теги</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedClients.map(client => {
                const clientTags = (client as any).tags || [];
                const discount = (client as any).discount || 0;
                
                return (
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
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{client.fullName}</span>
                            {discount > 0 && (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs">
                                <Gift className="w-3 h-3 mr-1" />
                                -{discount}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        <div>{client.phone}</div>
                        <div className="text-xs">{client.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-foreground font-medium">
                          <TrendingUp className="w-3 h-3" />
                          {client.totalVisits} визитов
                        </div>
                        {client.lastVisit && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(client.lastVisit).toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {clientTags.length > 0 ? (
                          clientTags.map((tag: string) => {
                            const tagInfo = CLIENT_TAGS.find(t => t.value === tag);
                            return tagInfo ? (
                              <Badge key={tag} variant="outline" className={`text-xs ${tagInfo.color}`}>
                                {tagInfo.label}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
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
                );
              })}
            </tbody>
          </table>
          {filteredAndSortedClients.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchQuery || filters.tags.length > 0 ? 'Клиенты не найдены' : 'Нет клиентов'}
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
