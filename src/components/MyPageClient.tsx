"use client"

import { useState } from "react"
import { User, Mail, CreditCard, Package, LogOut, Settings, Save, Edit2, Key, Lock } from "lucide-react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"

interface MyPageClientProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
  }
  itemStats: {
    totalCount: number
    totalValue: number
    avgPrice: number
    topCategory: string
    categoryBreakdown: Record<string, number>
  }
}

export default function MyPageClient({ user, itemStats }: MyPageClientProps) {
  const router = useRouter()
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const [name, setName] = useState(user.name || "")
  const [email, setEmail] = useState(user.email || "")
  
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [isUpdating, setIsUpdating] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const handleUpdateAccount = async (type: 'name' | 'email') => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...(type === 'name' ? { name } : { email })
        }),
      })

      if (response.ok) {
        if (type === 'name') setIsEditingName(false)
        else setIsEditingEmail(false)
        router.refresh()
      } else {
        const error = await response.text()
        alert(error || "更新に失敗しました")
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      alert("エラーが発生しました")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("新しいパスワードが一致しません")
      return
    }
    
    if (newPassword.length < 6) {
      alert("パスワードは6文字以上である必要があります")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      if (response.ok) {
        setIsChangingPassword(false)
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
        alert("パスワードを更新しました")
      } else {
        const error = await response.text()
        alert(error || "パスワードの更新に失敗しました")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      alert("エラーが発生しました")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
      <h1 className="text-3xl font-serif font-bold text-stone-800 mb-8">My Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Stats Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-stone-900 p-6 sm:p-8 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 p-2 rounded-full">
                <Settings className="w-5 h-5 text-stone-300" />
              </div>
              <h2 className="text-xl font-semibold">Summary</h2>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4">
              <div className="space-y-1">
                <p className="text-stone-400 text-xs sm:text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Total Value
                </p>
                <p className="text-2xl sm:text-3xl font-serif font-bold break-all">
                  ¥{itemStats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-stone-400 text-xs sm:text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Total Items
                </p>
                <p className="text-2xl sm:text-3xl font-serif font-bold">
                  {itemStats.totalCount} <span className="text-xs sm:text-sm font-sans font-normal text-stone-400">items</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-stone-400 text-xs sm:text-sm">Average Cost / Item</p>
                <p className="text-lg sm:text-xl font-serif font-bold break-all">
                  ¥{itemStats.avgPrice.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-stone-400 text-xs sm:text-sm">Top Category</p>
                <p className="text-lg sm:text-xl font-serif font-bold truncate">
                  {itemStats.topCategory || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800 mb-6">Category Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(itemStats.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-stone-600 truncate">{category}</span>
                      <span className="text-stone-400 shrink-0">{count} items</span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-800 rounded-full"
                        style={{
                          width: `${(count / itemStats.totalCount) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-stone-100 p-2 rounded-full">
                <User className="w-5 h-5 text-stone-600" />
              </div>
              <h2 className="text-xl font-semibold text-stone-800">Account</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider">Name</label>
                {isEditingName ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-200"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateAccount('name')}
                      disabled={isUpdating}
                      className="bg-stone-800 hover:bg-stone-900"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group mt-1">
                    <p className="text-stone-700 font-medium">{user.name || "未設定"}</p>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-stone-400 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wider">Email</label>
                {isEditingEmail ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-200"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateAccount('email')}
                      disabled={isUpdating}
                      className="bg-stone-800 hover:bg-stone-900"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group mt-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-stone-400" />
                      <p className="text-stone-600 text-sm">{user.email}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="text-stone-400 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  {isChangingPassword ? "Cancel Password Change" : "Change Password"}
                </button>

                {isChangingPassword && (
                  <div className="mt-4 space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500">Current Password</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-500">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-200"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={isUpdating || !oldPassword || !newPassword || !confirmPassword}
                      className="w-full bg-stone-800 hover:bg-stone-900 mt-2"
                    >
                      {isUpdating ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center border-t border-stone-200 pt-12">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full max-w-xs flex items-center justify-center gap-2 text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all py-6 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
