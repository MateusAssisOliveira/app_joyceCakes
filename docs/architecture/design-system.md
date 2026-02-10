# 🎨 Design System

Sistema de componentes e estilo visual do JoyceCakes.

---

## 🎯 O que é Design System?

É um conjunto unificado de:
- **Componentes:** Button, Card, Dialog, etc.
- **Cores:** Palleta visual consistente
- **Tipografia:** Fontes e tamanhos
- **Espaçamento:** Padding, margins
- **Iconografia:** Icons reutilizáveis

---

## 🎨 Cores

### Palleta Principal

```typescript
// src/lib/theme.ts
export const colors = {
  // Neutros
  slate:    { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  
  // Primária (Marca)
  emerald:  { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  
  // Secundária
  amber:    { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  
  // Status
  red:      { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  green:    { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 },
  blue:     { 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 }
}
```

### Usos

| Cor | Uso | Exemplo |
|-----|-----|---------|
| 🟢 **Emerald** | Primária, sucesso | Botão ação, lucro |
| 🟡 **Amber** | Atenção, aviso | Estoque baixo |
| 🔴 **Red** | Erro, perigo | Deletar, erro |
| 🔵 **Blue** | Info, link | Dicas, links |
| ⚫ **Slate** | Fundo, texto | Cards, backgrounds |

---

## 📝 Tipografia

### Fonte Principal

```css
/* Tailwind + Inter Font */
font-family: 'Inter var', system-ui, sans-serif;
```

### Tamanhos

```typescript
export const typography = {
  h1: 'text-4xl font-bold',      // 36px, 700
  h2: 'text-3xl font-bold',      // 30px, 700
  h3: 'text-2xl font-semibold',  // 24px, 600
  h4: 'text-xl font-semibold',   // 20px, 600
  
  body: 'text-base',             // 16px, 400
  small: 'text-sm',              // 14px, 400
  xs: 'text-xs',                 // 12px, 400
  
  caption: 'text-xs text-slate-500' // 12px, cinzento
}
```

### Exemplo de Uso

```tsx
// Título
<h1 className="text-3xl font-bold">Bem-vindo</h1>

// Corpo
<p className="text-base">Texto normal</p>

// Label
<label className="text-sm font-medium">Email:</label>

// Caption
<p className="text-xs text-slate-500">Última atualização: hoje</p>
```

---

## 🧩 Componentes Principais

### Button

```tsx
// Variações
<Button>Padrão</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="destructive">Deletar</Button>
<Button variant="outline">Contorno</Button>
<Button variant="ghost">Ghost</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button>Médio (default)</Button>
<Button size="lg">Grande</Button>

// Estados
<Button disabled>Desabilitado</Button>
<Button isLoading>Carregando...</Button>
```

---

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo principal
  </CardContent>
  <CardFooter>
    Rodapé / ações
  </CardFooter>
</Card>
```

---

### Dialog/Modal

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmação</DialogTitle>
    </DialogHeader>
    
    <p>Tem certeza?</p>
    
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Badge

```tsx
// Variações de status
<Badge>Padrão</Badge>
<Badge variant="secondary">Secundário</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">Contorno</Badge>

// Exemplo: Produto ativo/inativo
<Badge variant={product.isActive ? "default" : "outline"}>
  {product.isActive ? "Ativo" : "Inativo"}
</Badge>
```

---

### Alert

```tsx
// Tipos
<Alert> {/* default (azul) */}
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Mensagem informativa</AlertDescription>
</Alert>

<Alert variant="destructive"> {/* vermelho */}
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>Algo deu errado</AlertDescription>
</Alert>

<Alert variant="success"> {/* verde */}
  <AlertTitle>Sucesso</AlertTitle>
  <AlertDescription>Operação concluída</AlertDescription>
</Alert>
```

---

## 🎭 Padrões de Layout

### Grid 12 Colunas

```tsx
<div className="grid grid-cols-12 gap-4">
  {/* Full width */}
  <div className="col-span-12">
    <Card />
  </div>
  
  {/* Dois colunas */}
  <div className="col-span-6">
    <Card />
  </div>
  <div className="col-span-6">
    <Card />
  </div>
  
  {/* Três colunas */}
  <div className="col-span-4">Card</div>
  <div className="col-span-4">Card</div>
  <div className="col-span-4">Card</div>
</div>
```

### Sidebar + Content

```tsx
<div className="flex gap-6">
  {/* Sidebar */}
  <aside className="w-64 border-r">
    <nav>Menu items</nav>
  </aside>
  
  {/* Content */}
  <main className="flex-1">
    <Card />
  </main>
</div>
```

---

## 🎯 Espaçamento

```typescript
export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}
```

### Exemplo

```tsx
{/* Padding */}
<div className="p-4">Padding 16px</div>
<div className="px-4 py-2">PX=16px, PY=8px</div>

{/* Margin */}
<div className="mb-4">Margin bottom 16px</div>
<div className="mt-8 mb-4">MT=32px, MB=16px</div>

{/* Gap entre items */}
<div className="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 🌓 Dark Mode

```tsx
// App está configurado com suporte a dark mode

// Automático baseado em sistema
<html className="dark">
  {/* Estilos dark ativos */}
</html>

// Uso em componentes
<div className="bg-slate-100 dark:bg-slate-900">
  Light: bg cinzento claro
  Dark: bg cinzento escuro
</div>
```

---

## ♿ Acessibilidade

### WCAG 2.1 AA Compliance

```tsx
// ✅ Semântica HTML
<button aria-label="Fechar diálogo">×</button>

// ✅ Contraste de cores
Texto: contrast ratio mínimo 4.5:1

// ✅ Focus visible
<input className="focus:ring-2 focus:ring-emerald-500" />

// ✅ ARIA labels
<span aria-live="polite">Produto adicionado</span>
```

---

## 📱 Responsividade

```tsx
// Mobile-first
<div className="
  grid grid-cols-1     // Mobile: 1 coluna
  sm:grid-cols-2       // Tablet: 2 colunas (640px+)
  lg:grid-cols-3       // Desktop: 3 colunas (1024px+)
">
  <Card />
  <Card />
  <Card />
</div>
```

### Breakpoints Tailwind

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## 🎨 Customização

### Editar Cores

Arquivo: `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          // ... cores customizadas
        }
      }
    }
  }
}
```

### Editar Componentes

Pasta: `src/components/ui/`

```
button.tsx
card.tsx
dialog.tsx
badge.tsx
alert.tsx
...
```

Edite `className` e props conforme necessário.

---

## ✅ Checklist Novo Componente

- [ ] Criar arquivo em `src/components/ui/component.tsx`
- [ ] Usar Radix UI como base
- [ ] Tailwind para estilos
- [ ] Exportar em `src/components/ui/index.ts`
- [ ] TypeScript types definidos
- [ ] Dark mode testado
- [ ] Mobile responsivo
- [ ] Acessibilidade (ARIA labels)
- [ ] Documentação comentada

---

**Próximo:** [Tech Stack](tech-stack.md) | [Project Structure](project-structure.md)
