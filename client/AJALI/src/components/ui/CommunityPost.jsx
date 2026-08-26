	
import Avatar from './Avatar.jsx'

export default function CommunityPost({ post }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/[0.06] bg-ink-800/70 p-4">
      <Avatar name={post.author} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-semibold text-slate-100">{post.author}</span>
          <span className="text-xs text-slate-500">{post.time}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{post.body}</p>
      </div>
    </div>
  )
}