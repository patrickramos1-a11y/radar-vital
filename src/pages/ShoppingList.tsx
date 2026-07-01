import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, ShoppingCart } from "lucide-react";

type ShoppingItem = {
  id: string;
  name: string;
  bought: boolean;
};

const SHOPPING_ITEMS_KEY = "shopping-list-items";
const PURCHASE_HISTORY_KEY = "shopping-list-history";

const parseStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeName = (value: string) => value.trim().toLowerCase();

const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [history, setHistory] = useState<Record<string, number>>({});
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    setItems(parseStorage<ShoppingItem[]>(SHOPPING_ITEMS_KEY, []));
    setHistory(parseStorage<Record<string, number>>(PURCHASE_HISTORY_KEY, {}));
  }, []);

  useEffect(() => {
    localStorage.setItem(SHOPPING_ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = items.some((item) => normalizeName(item.name) === normalizeName(trimmed));
    if (exists) {
      setNewItem("");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        bought: false,
      },
    ]);

    setNewItem("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addItem(newItem);
  };

  const toggleBought = (id: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (!item.bought && checked) {
          const normalized = normalizeName(item.name);
          setHistory((current) => ({
            ...current,
            [normalized]: (current[normalized] ?? 0) + 1,
          }));
        }

        return { ...item, bought: checked };
      }),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBoughtItems = () => {
    setItems((prev) => prev.filter((item) => !item.bought));
  };

  const suggestions = useMemo(
    () =>
      Object.entries(history)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({
          name,
          count,
          alreadyInList: items.some((item) => normalizeName(item.name) === name),
        })),
    [history, items],
  );

  const boughtCount = items.filter((item) => item.bought).length;

  return (
    <AppLayout>
      <div className="h-full overflow-auto p-4 md:p-8 bg-background">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Lista de Compras</h1>
              <p className="text-muted-foreground text-sm">Cadastre o que você comprou e reutilize itens com pré-seleção rápida.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar item</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(event) => setNewItem(event.target.value)}
                  placeholder="Ex.: Arroz, Leite, Sabonete..."
                />
                <Button type="submit" className="shrink-0">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Pré-seleção rápida</CardTitle>
              <Badge variant="secondary">Top itens comprados</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Marque itens como comprados para criar sugestões automáticas.</p>
                )}
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.name}
                    type="button"
                    variant={suggestion.alreadyInList ? "secondary" : "outline"}
                    disabled={suggestion.alreadyInList}
                    onClick={() => addItem(suggestion.name)}
                    className="h-auto py-1.5"
                  >
                    {suggestion.name} ({suggestion.count})
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Itens da lista</CardTitle>
              <div className="flex items-center gap-3">
                <Badge>{boughtCount}/{items.length} comprados</Badge>
                <Button type="button" variant="destructive" size="sm" onClick={clearBoughtItems} disabled={boughtCount === 0}>
                  Limpar comprados
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px] pr-2">
                <div className="space-y-2">
                  {items.length === 0 && <p className="text-sm text-muted-foreground">Sua lista está vazia.</p>}
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={item.bought} onCheckedChange={(value) => toggleBought(item.id, value === true)} />
                        <span className={item.bought ? "line-through text-muted-foreground" : ""}>{item.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ShoppingList;
