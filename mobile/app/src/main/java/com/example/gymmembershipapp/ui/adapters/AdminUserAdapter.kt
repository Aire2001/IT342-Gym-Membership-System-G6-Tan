package com.example.gymmembershipapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.RecyclerView
import com.example.gymmembershipapp.data.AdminUserDTO
import com.example.gymmembershipapp.databinding.ItemAdminUserBinding

class AdminUserAdapter(
    private val users: List<AdminUserDTO>,
    private val onEditRole: (AdminUserDTO, String) -> Unit,
    private val onDelete: (AdminUserDTO) -> Unit,
    private val onItemClick: ((AdminUserDTO) -> Unit)? = null
) : RecyclerView.Adapter<AdminUserAdapter.VH>() {

    inner class VH(val binding: ItemAdminUserBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemAdminUserBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val user = users[position]
        with(holder.binding) {
            val first = user.firstname ?: ""
            val last = user.lastname ?: ""
            val initials = "${first.firstOrNull() ?: ""}${last.firstOrNull() ?: ""}".uppercase().ifEmpty { "?" }
            tvInitials.text = initials
            tvName.text = "$first $last".trim().ifEmpty { "—" }
            tvEmail.text = user.email
            tvJoined.text = user.createdAt?.take(10)?.let { "Joined $it" } ?: ""

            tvRole.text = user.role
            val (bg, fg) = if (user.role.equals("ADMIN", ignoreCase = true))
                Pair(0xFFFEF3C7.toInt(), 0xFF92400E.toInt())
            else
                Pair(0xFFDCFCE7.toInt(), 0xFF166534.toInt())
            tvRole.setBackgroundColor(bg)
            tvRole.setTextColor(fg)

            if (onItemClick != null) {
                holder.itemView.setOnClickListener { onItemClick.invoke(user) }
            }

            btnEditRole.setOnClickListener {
                val roles = arrayOf("MEMBER", "ADMIN")
                AlertDialog.Builder(it.context)
                    .setTitle("Change Role")
                    .setItems(roles) { _, which -> onEditRole(user, roles[which]) }
                    .show()
            }

            btnDelete.setOnClickListener {
                AlertDialog.Builder(it.context)
                    .setTitle("Delete User")
                    .setMessage("Delete ${user.email}? This cannot be undone.")
                    .setPositiveButton("Delete") { _, _ -> onDelete(user) }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        }
    }

    override fun getItemCount() = users.size
}
