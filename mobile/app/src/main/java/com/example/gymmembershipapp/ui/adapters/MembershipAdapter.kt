package com.example.gymmembershipapp.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.gymmembershipapp.data.MembershipDTO
import com.example.gymmembershipapp.databinding.ItemMembershipPlanBinding

class MembershipAdapter(
    private val plans: List<MembershipDTO>,
    private val isAdmin: Boolean,
    private val onSelect: (MembershipDTO) -> Unit
) : RecyclerView.Adapter<MembershipAdapter.VH>() {

    inner class VH(val binding: ItemMembershipPlanBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemMembershipPlanBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val plan = plans[position]
        with(holder.binding) {
            tvPlanName.text = plan.name
            tvDescription.text = plan.description
            tvPrice.text = "₱${String.format("%,.2f", plan.price)}"
            tvDuration.text = "${plan.durationMonths} month${if (plan.durationMonths != 1) "s" else ""}"

            if (plan.name.contains("premium", ignoreCase = true)) {
                tvBadge.text = "POPULAR"
                tvBadge.visibility = View.VISIBLE
            } else {
                tvBadge.visibility = View.GONE
            }

            if (isAdmin) {
                btnSelect.isEnabled = false
                btnSelect.alpha = 0.5f
            } else {
                btnSelect.isEnabled = true
                btnSelect.alpha = 1f
                btnSelect.setOnClickListener { onSelect(plan) }
            }
        }
    }

    override fun getItemCount() = plans.size
}
