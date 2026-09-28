import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FoodAnalysis from './pages/FoodAnalysis.jsx'
import Recommendation from './pages/Recommendation.jsx'
import Comparison from './pages/Comparison.jsx'
import Optimization from './pages/Optimization.jsx'
import Reports from './pages/Reports.jsx'
import ReportDetail from './pages/ReportDetail.jsx'
import FoodDatabase from './pages/FoodDatabase.jsx'
import PackagingDatabase from './pages/PackagingDatabase.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analyze" element={<ProtectedRoute><FoodAnalysis /></ProtectedRoute>} />
        <Route path="/analysis/:id/recommendation" element={<ProtectedRoute><Recommendation /></ProtectedRoute>} />
        <Route path="/analysis/:id/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
        <Route path="/optimization" element={<ProtectedRoute><Optimization /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/analysis/:id/report" element={<ProtectedRoute><ReportDetail /></ProtectedRoute>} />
        <Route path="/foods-database" element={<ProtectedRoute><FoodDatabase /></ProtectedRoute>} />
        <Route path="/packaging-database" element={<ProtectedRoute><PackagingDatabase /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  )
}
