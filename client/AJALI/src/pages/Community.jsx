import { useState } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useData } from '../context/DataContext.jsx'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/ui/Avatar.jsx'
import CommunityPost from '../components/ui/CommunityPost.jsx'

export default function Community() {
  const { user } = useAuth()
  const { posts, addPost } = useData()
  const [draft, setDraft] = useState('')
  const navigate = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    addPost({ author: user?.username || 'You', body: draft.trim() })
    setDraft('')
  }

  return (
    <div className="mx-auto max-w-3xl animate-fadeUp">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Community</h1>
      <p className="mt-1 text-sm text-slate-400">
        Share updates, ask for help, or communicate with others in your area. Keep it urgent and relevant.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 p-5">
        <div className="flex gap-3">
          <Avatar name={user?.username || 'You'} size={40} />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's happening? Share a real-time update…"
            rows={3}
            className="input-field flex-1 resize-none"
          />
        </div>
        <div className="mt-3 flex justify-end border-t border-white/[0.06] pt-3">
          <button type="submit" className="btn-primary !rounded-full !px-5 !py-2 text-sm">
            <Send size={14} /> Submit Post
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {posts.map((post) => (
          <CommunityPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
