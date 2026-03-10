import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'
import { Layout } from '@/components/Layout'
import { AdminLayout } from '@/components/AdminLayout'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { Home } from '@/pages/Home'
import { Recipes } from '@/pages/Recipes'
import { RecipeDetail } from '@/pages/RecipeDetail'
import { RecipeForm } from '@/pages/RecipeForm'
import { AddRecipe } from '@/pages/AddRecipe'
import { Grocery } from '@/pages/Grocery'
import { GroceryListDetail } from '@/pages/GroceryListDetail'
import { Profile } from '@/pages/Profile'
import { Groups } from '@/pages/Groups'
import { Pantry } from '@/pages/Pantry'
import { Discover } from '@/pages/Discover'
import { MealPlan } from '@/pages/MealPlan'
import { JoinHousehold } from '@/pages/JoinHousehold'
import { AdminOverview } from '@/pages/admin/Overview'
import { AdminUsersPage } from '@/pages/admin/UsersPage'
import { AdminSettingsPage } from '@/pages/admin/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
        <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/join/:token" element={<JoinHousehold />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/add" element={<AddRecipe />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeForm />} />
            <Route path="/grocery" element={<Grocery />} />
            <Route path="/grocery/:id" element={<GroceryListDetail />} />
            <Route path="/meal-plan" element={<MealPlan />} />
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Routes>
        </ThemeProvider>
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
