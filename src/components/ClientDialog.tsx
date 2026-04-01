import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Client } from '@/lib/data';
import { CLIENT_TAGS, PREFERENCES } from '@/lib/clientExtensions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (client: Omit<Client, 'id' | 'totalVisits' | 'lastVisit'> & { id?: string }) => void;
}

export default function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthday: '',
    preferences: [] as string[],
    allergies: '',
    tags: [] as string[],
    discount: 0,
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
        birthday: (client as any).birthday || '',
        preferences: (client as any).preferences || [],
        allergies: (client as any).allergies || '',
        tags: (client as any).tags || [],
        discount: (client as any).discount || 0,
        notes: (client as any).notes || '',
      });
    } else {
      setFormData({ 
        fullName: '', 
        phone: '', 
        email: '',
        birthday: '',
        preferences: [],
        allergies: '',
        tags: [],
        discount: 0,
        notes: '',
      });
    }
  }, [client, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(client ? { ...formData, id: client.id } : formData);
    onOpenChange(false);
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
        </DialogHeader>
        <p className="sr-only">Форма для {client ? 'редактирования' : 'создания'} клиента с основной информацией, предпочтениями и дополнительными данными</p>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Основное</TabsTrigger>
              <TabsTrigger value="preferences">Предпочтения</TabsTrigger>
              <TabsTrigger value="additional">Дополнительно</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName">ФИО *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Анна Иванова"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (900) 123-45-67"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birthday">День рождения</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="discount">Персональная скидка (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div>
                <Label>Предпочтения</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PREFERENCES.map(pref => (
                    <Badge
                      key={pref}
                      variant={formData.preferences.includes(pref) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => togglePreference(pref)}
                    >
                      {pref}
                      {formData.preferences.includes(pref) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="allergies">Аллергии и противопоказания</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Укажите аллергии, противопоказания или особые требования..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4 mt-4">
              <div>
                <Label>Теги</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CLIENT_TAGS.map(tag => (
                    <Badge
                      key={tag.value}
                      variant={formData.tags.includes(tag.value) ? 'default' : 'outline'}
                      className={`cursor-pointer ${formData.tags.includes(tag.value) ? tag.color : ''}`}
                      onClick={() => toggleTag(tag.value)}
                    >
                      {tag.label}
                      {formData.tags.includes(tag.value) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Заметки</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация о клиенте..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              {client ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
