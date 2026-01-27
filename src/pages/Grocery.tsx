import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Grocery() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grocery List</h1>
        <p className="text-muted-foreground">Items you need to buy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your list is empty</CardTitle>
          <CardDescription>Add recipes to your meal plan to generate a grocery list</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once you plan your meals, we'll automatically generate a shopping list with all the ingredients you need.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
