# 📱 FaceModel — Адаптивность и пропорции

## ✅ Исправлено

### 1. Пропорции Canvas
**Было:** Фиксированная высота растягивала Canvas непропорционально
**Стало:**
- **Десктоп**: `height` prop (по умолчанию 420px)
- **Мобильные** (<768px): `aspect-ratio: 3/4` + `max-height: 70vh`
- Canvas всегда `width: 100%` и `height: 100%` внутри контейнера

### 2. Легенда зон
**Было:** Вертикальная легенда справа перекрывала модель на мобильных
**Стало:**
- **Десктоп**: Вертикальная легенда справа (как было)
- **Мобильные**: Горизонтальная прокручиваемая легенда внизу
  - Скрытый скроллбар (`.scrollbar-hide`)
  - Компактные кнопки с `whitespace-nowrap`
  - Отступ от tooltip'а

### 3. DPR (Device Pixel Ratio)
- **Десктоп**: `dpr={[1, 2]}` — высокое качество
- **Мобильные**: `dpr={[1, 1.5]}` — баланс качества и производительности

### 4. Tooltip
- Адаптивная ширина (`min-width: 200px`)
- Всегда внизу по центру
- Не перекрывается легендой

## 📐 Использование

```tsx
// Автоматически адаптируется
<FaceModel
  mode="history"
  activeZones={['left_cheek', 'neck']}
  selectedZone={selectedZone}
  onZoneClick={setSelectedZone}
/>

// Кастомная высота на десктопе
<FaceModel
  height={500}
  mode="demo"
/>

// Без легенды
<FaceModel
  showLegend={false}
/>
```

## 🎨 Breakpoints

- **< 768px** — мобильный режим
  - Aspect ratio 3:4
  - Горизонтальная легенда
  - DPR 1.5
  
- **≥ 768px** — десктоп режим
  - Фиксированная высота
  - Вертикальная легенда
  - DPR 2.0

## 🔧 CSS классы

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

## ✨ Особенности

1. **Responsive detection** — `window.innerWidth` с resize listener
2. **Aspect ratio** — сохраняет пропорции модели на любом экране
3. **Touch-friendly** — увеличенные зоны клика на мобильных
4. **Performance** — пониженный DPR на слабых устройствах
