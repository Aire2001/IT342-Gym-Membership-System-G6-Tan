package com.example.gymmembershipapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.RecyclerView
import com.example.gymmembershipapp.data.PaymentDTO
import com.example.gymmembershipapp.databinding.ItemPaymentBinding

class PaymentHistoryAdapter(
    private val payments: List<PaymentDTO>
) : RecyclerView.Adapter<PaymentHistoryAdapter.VH>() {

    inner class VH(val binding: ItemPaymentBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemPaymentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val p = payments[position]
        with(holder.binding) {
            tvMembershipName.text = p.membershipName ?: "—"
            tvReference.text = p.paymentReference ?: "—"
            tvMethodDate.text = buildString {
                if (!p.paymentMethod.isNullOrBlank()) append(p.paymentMethod)
                if (!p.paymentDate.isNullOrBlank()) {
                    if (isNotEmpty()) append(" · ")
                    append(p.paymentDate.take(10))
                }
            }
            tvAmount.text = "₱${String.format("%,.2f", p.amount)}"

            tvStatus.text = p.paymentStatus
            val (bg, fg) = when (p.paymentStatus.uppercase()) {
                "COMPLETED" -> Pair(0xFFD1FAE5.toInt(), 0xFF065F46.toInt())
                "PENDING"   -> Pair(0xFFFEF3C7.toInt(), 0xFF92400E.toInt())
                else        -> Pair(0xFFFEE2E2.toInt(), 0xFF991B1B.toInt())
            }
            tvStatus.setBackgroundColor(bg)
            tvStatus.setTextColor(fg)

            btnReceipt.setOnClickListener {
                AlertDialog.Builder(it.context)
                    .setTitle("Payment Receipt")
                    .setMessage(
                        "Plan: ${p.membershipName ?: "—"}\n" +
                        "Ref: ${p.paymentReference ?: "—"}\n" +
                        "Method: ${p.paymentMethod ?: "—"}\n" +
                        "Date: ${p.paymentDate?.take(10) ?: "—"}\n" +
                        "Amount: ₱${String.format("%,.2f", p.amount)}\n" +
                        "Status: ${p.paymentStatus}"
                    )
                    .setPositiveButton("Close", null)
                    .show()
            }
        }
    }

    override fun getItemCount() = payments.size
}
