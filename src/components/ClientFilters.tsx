import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CLIENT_TAGS } from '@/lib/clientExtensions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ClientFilterOptions {
  tags: string[];
  sortBy: 'name' | 'visits' | 'lastVisit' | 'totalSpent';
  sortOrder: 'asc' | 'desc';
  hasDiscount: boolean | null;
}

interface ClientFiltersProps {
  filters: ClientFilterOptions;
  onFiltersChange: (filters: ClientFilterOptions) => void;
}

export default function ClientFilters({ filters, onFiltersChange }: ClientFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({
      tags: [],
      sortBy: 'name',
      sortOrder: 'asc',
      hasDiscount: null,
    });
  };

  const activeFiltersCount = filters.tags.length + (filters.hasDiscount !== null ? 1 : 0);

  const sortOptions = [
    { value: 'name', label: 'По имени' },
    { value: 'visits', label: 'По визитам' },
    { value: 'lastVisit', label: 'По дате визита' },
    { value: 'totalSpent', label: 'По сумме' },
  ];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs h-5 min-w-[20px]">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Фильтры</span>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                Сбросить
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Теги */}
          <div className="px-2 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Теги</p>
            <div className="flex flex-wrap gap-1.5">
              {CLIENT_TAGS.map(tag => (
                <Badge
                  key={tag.value}
                  variant={filters.tags.includes(tag.value) ? 'default' : 'outline'}
                  className={`cursor-pointer text-xs ${
                    filters.tags.includes(tag.value) ? tag.color : ''
                  }`}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Скидка */}
          <DropdownMenuCheckboxItem
            checked={filters.hasDiscount === true}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, hasDiscount: checked ? true : null })
            }
          >
            Со скидкой
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          {/* Сортировка */}
          <div className="px-2 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Сортировка</p>
            <div className="space-y-1">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      sortBy: option.value as any,
                    })
                  }
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    filters.sortBy === option.value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              <Button
                variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, sortOrder: 'asc' })}
                className="flex-1 h-7 text-xs"
              >
                ↑ Возр.
              </Button>
              <Button
                variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, sortOrder: 'desc' })}
                className="flex-1 h-7 text-xs"
              >
                ↓ Убыв.
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filters display */}
      <AnimatePresence>
        {filters.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-1.5"
          >
            {filters.tags.map(tag => {
              const tagInfo = CLIENT_TAGS.find(t => t.value === tag);
              return (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`${tagInfo?.color} cursor-pointer`}
                  onClick={() => toggleTag(tag)}
                >
                  {tagInfo?.label}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
