import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Banknote, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import ServiceDialog from '@/components/ServiceDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { defaultServices, type Service } from '@/lib/data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const handleSave = (serviceData: Omit<Service, 'id'> & { id?: string }) => {
    if (serviceData.id) {
      // Edit existing
      setServices(services.map(s => s.id === serviceData.id ? serviceData as Service : s));
      toast.success('Услуга обновлена');
    } else {
      // Create new
      const newService: Service = {
        ...serviceData,
        id: Date.now().toString(),
      };
      setServices([...services, newService]);
      toast.success('Услуга создана');
    }
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setDeletingService(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingService) {
      setServices(services.filter(s => s.id !== deletingService.id));
      toast.success('Услуга удалена');
      setDeletingService(null);
    }
  };

  const handleAddNew = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  return (
    <div>
      <Topbar title="Услуги" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">{services.length} услуг</p>
          <button 
            onClick={handleAddNew}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Добавить услугу
          </button>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <motion.div key={service.id} variants={item} className="glass-card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground leading-tight">{service.name}</h3>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button 
                    onClick={() => handleEdit(service)}
                    className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(service)}
                    className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {service.description && (
                <p className="text-xs text-muted-foreground mb-4 flex-1">{service.description}</p>
              )}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{service.duration} мин</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold text-primary">{service.price.toLocaleString()} ₽</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingService}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить услугу?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить услугу "{deletingService?.name}"? Это действие нельзя отменить.
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
