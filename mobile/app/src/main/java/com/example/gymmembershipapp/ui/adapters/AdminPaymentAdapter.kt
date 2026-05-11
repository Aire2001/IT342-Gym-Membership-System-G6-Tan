package com.example.gymmembershipapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.RecyclerView
import com.example.gymmembershipapp.data.AdminPaymentDTO
import com.example.gymmembershipapp.databinding.ItemAdminPaymentBinding

class AdminPaymentAdapter(
    private val payments: List<AdminPaymentDTO>,
    private val onEditStatus: (AdminPaymentDTO, String) -> Unit,
    private val onDelete: (AdminPaymentDTO) -> Unit
) : RecyclerView.Adapter<AdminPaymentAdapter.VH>() {

    inner class VH(val binding: ItemAdminPaymentBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemAdminPaymentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val p = payments[position]
        with(holder.binding) {
            tvUserEmail.text = p.userEmail ?: "—"
            tvReference.text = p.paymentReference ?: "—"
            tvPlanMethod.text = "${p.membershipName ?: "—"} · ${p.paymentMethod ?: "—"}"
            tvDate.text = p.paymentDate?.take(10) ?: "—"
            tvAmount.text = "₱${String.format("%,.2f", p.amount)}"

            tvStatus.text = p.paymentStatus
            val (bg, fg) = when (p.paymentStatus.uppercase()) {
                "COMPLETED" -> Pair(0xFFD1FAE5.toInt(), 0xFF065F46.toInt())
                "PENDING"   -> Pair(0xFFFEF3C7.toInt(), 0xFF92400E.toInt())
                else        -> Pair(0xFFFEE2E2.toInt(), 0xFF991B1B.toInt())
            }
            tvStatus.setBackgroundColor(bg)
            tvStatus.setTextColor(fg)

            btnEditStatus.setOnClickListener {
                val statuses = arrayOf("PENDING", "COMPLETED", "FAILED")
                AlertDialog.Builder(it.context)
                    .setTitle("Update Payment Status")
                    .setItems(statuses) { _, which -> onEditStatus(p, statuses[which]) }
                    .show()
            }

            btnDelete.setOnClickListener {
                AlertDialog.Builder(it.context)
                    .setTitle("Delete Payment")
                    .setMessage("Delete payment ${p.paymentReference ?: ""}?")
                    .setPositiveButton("Delete") { _, _ -> onDelete(p) }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        }
    }

    override fun getItemCount() = payments.size
}
