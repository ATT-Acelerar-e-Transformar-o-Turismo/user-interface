import { useState, useEffect } from 'react'
import AdminPageLayout from '../components/AdminPageLayout'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import userService from '../services/userService'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const allUsers = await userService.getAll(0, 100)
            // Ensure we always have an array
            setUsers(Array.isArray(allUsers) ? allUsers : [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleRole = async (userId, currentRole) => {
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin'
            await userService.updateRole(userId, newRole)

            setUsers(users.map(user =>
                user.id === userId
                    ? { ...user, role: newRole }
                    : user
            ))
        } catch (err) {
            const errorMessage = err.userMessage || err.response?.data?.detail || err.message || 'Erro desconhecido'
            alert('Erro ao alterar role do utilizador: ' + errorMessage)
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Tem a certeza que deseja excluir este utilizador?')) {
            return
        }

        try {
            await userService.deleteUser(userId)
            setUsers(users.filter(user => user.id !== userId))
        } catch (err) {
            const errorMessage = err.userMessage || err.response?.data?.detail || err.message || 'Erro desconhecido'
            alert('Erro ao excluir utilizador: ' + errorMessage)
        }
    }

    const getRoleBadgeColor = (role) => {
        return role === 'admin'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <AdminPageLayout title="User Management">
                <div className="py-8">
                    <LoadingSkeleton />
                </div>
            </AdminPageLayout>
        )
    }

    if (error) {
        return (
            <AdminPageLayout title="User Management">
                <div className="py-8">
                    <ErrorDisplay error={error} />
                </div>
            </AdminPageLayout>
        )
    }

    return (
        <AdminPageLayout title="User Management">
            <div className="min-h-screen py-8 px-4 bg-base-100">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Gestão de Utilizadores
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Gerir utilizadores e roles do sistema
                            </p>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {users.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mx-auto w-24 h-24 mb-4">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum utilizador encontrado</h3>
                                <p className="text-gray-600">Os utilizadores registados aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nome
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                E-mail
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Data de Registo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Último Login
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Array.isArray(users) && users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.full_name || user.name || 'Nome não informado'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role === 'admin' ? 'Administrador' : 'Utilizador'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(user.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.last_login_at ? formatDate(user.last_login_at) : 'Nunca'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleToggleRole(user.id, user.role)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    )
}