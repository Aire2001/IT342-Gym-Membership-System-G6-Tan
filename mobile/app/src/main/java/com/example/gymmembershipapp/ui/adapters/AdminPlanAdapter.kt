package com.example.gymmembershipapp.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.RecyclerView
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.databinding.ItemAdminPlanBinding

class AdminPlanAdapter(
    private val plans: List<MembershipDTO>,
    private val onEdit: (MembershipDTO) -> Unit,
    private val onDelete: (MembershipDTO) -> Unit
) : RecyclerView.Adapter<AdminPlanAdapter.VH>() {

    inner class VH(val binding: ItemAdminPlanBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemAdminPlanBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val plan = plans[position]
        with(holder.binding) {
            tvName.text = plan.name
            tvPriceDuration.text = "₱${String.format("%,.2f", plan.price)} · ${plan.durationMonths} month${if (plan.durationMonths != 1) "s" else ""}"
            tvDescription.text = plan.description

            btnEdit.setOnClickListener { onEdit(plan) }

            btnDelete.setOnClickListener {
                AlertDialog.Builder(it.context)
                    .setTitle("Delete Plan")
                    .setMessage("Delete ${plan.name}? Members on this plan may be affected.")
                    .setPositiveButton("Delete") { _, _ -> onDelete(plan) }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        }
    }

    override fun getItemCount() = plans.size
}
