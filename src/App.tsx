import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { HouseholdProvider } from '@/contexts/HouseholdContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
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
import { JoinHousehold } from '@/pages/JoinHousehold'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
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
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
