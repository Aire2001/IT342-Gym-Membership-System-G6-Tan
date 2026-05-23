package edu.cit.tan.GymMembershipPaymentSystem.shared.service;

import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Membership;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.Payment;
import edu.cit.tan.GymMembershipPaymentSystem.shared.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");

    private boolean isConfigured() {
        boolean ok = mailSender != null && fromEmail != null && !fromEmail.isBlank()
                && !fromEmail.equals("your-email@gmail.com");
        if (!ok) System.out.println("⚠️ Email NOT configured: mailSender=" + mailSender + " fromEmail=" + fromEmail);
        return ok;
    }

    /** Payment receipt → sent to user after any payment */
    public void sendPaymentReceipt(User user, Payment payment, Membership membership) {
        System.out.println("📧 sendPaymentReceipt called for: " + user.getEmail() + " notifEmail=" + user.isNotifEmail());
        if (!isConfigured() || !user.isNotifEmail()) return;
        try {
            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "FitLife Gym");
            helper.setTo(user.getEmail());

            boolean isPending = "PENDING".equalsIgnoreCase(payment.getPaymentStatus());
            helper.setSubject(isPending
                    ? "FitLife Gym – Payment Pending: " + payment.getPaymentReference()
                    : "FitLife Gym – Payment Receipt: " + payment.getPaymentReference());

            String statusColor = isPending ? "#D97706" : "#059669";
            String statusLabel = isPending ? "Pending" : "Completed";

            helper.setText("""
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
                      <div style="background:#2563EB;padding:20px 24px;border-radius:8px 8px 0 0;text-align:center">
                        <h1 style="color:#fff;margin:0;font-size:22px">FitLife Gym</h1>
                        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Membership Portal</p>
                      </div>
                      <div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
                        <p style="color:#374151;font-size:15px">Hi <strong>%s</strong>,</p>
                        <p style="color:#6b7280;font-size:14px">%s</p>
                        <table style="width:100%%;border-collapse:collapse;margin:20px 0;font-size:14px">
                          <tr style="background:#f3f4f6"><td style="padding:10px 14px;color:#6b7280;border-radius:6px 0 0 0">Reference No.</td><td style="padding:10px 14px;font-weight:bold;font-family:monospace;border-radius:0 6px 0 0">%s</td></tr>
                          <tr><td style="padding:10px 14px;color:#6b7280">Plan</td><td style="padding:10px 14px;font-weight:600">%s</td></tr>
                          <tr style="background:#f3f4f6"><td style="padding:10px 14px;color:#6b7280">Duration</td><td style="padding:10px 14px">%d %s</td></tr>
                          <tr><td style="padding:10px 14px;color:#6b7280">Method</td><td style="padding:10px 14px">%s</td></tr>
                          <tr style="background:#f3f4f6"><td style="padding:10px 14px;color:#6b7280">Date</td><td style="padding:10px 14px">%s</td></tr>
                          <tr style="border-top:2px solid #e5e7eb"><td style="padding:12px 14px;color:#374151;font-weight:700">Amount</td><td style="padding:12px 14px;color:#2563EB;font-weight:900;font-size:18px">₱%,.2f</td></tr>
                          <tr><td style="padding:10px 14px;color:#6b7280">Status</td><td style="padding:10px 14px"><span style="background:#ecfdf5;color:%s;border:1px solid;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700">%s</span></td></tr>
                        </table>
                        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">Thank you for choosing FitLife Gym. Stay fit!</p>
                      </div>
                    </div>
                    """.formatted(
                    user.getFirstname(),
                    isPending
                            ? "Your Bank Transfer payment is being verified. Your membership will activate once confirmed."
                            : "Your payment was successful and your membership is now active!",
                    payment.getPaymentReference(),
                    membership.getName(),
                    membership.getDurationMonths(),
                    membership.getDurationMonths() == 1 ? "month" : "months",
                    payment.getPaymentMethod(),
                    payment.getPaymentDate() != null ? payment.getPaymentDate().format(DATE_FMT) : "—",
                    payment.getAmount().doubleValue(),
                    statusColor,
                    statusLabel
            ), true);

            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ Email send failed (receipt): " + e.getMessage());
        }
    }

    /** Password reset email — sent when user requests a password reset */
    public void sendPasswordResetEmail(User user, String resetLink) {
        if (!isConfigured()) return;
        try {
            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "FitLife Gym");
            helper.setTo(user.getEmail());
            helper.setSubject("FitLife Gym – Password Reset Request");
            helper.setText("""
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
                      <div style="background:#2563EB;padding:20px 24px;border-radius:8px 8px 0 0;text-align:center">
                        <h1 style="color:#fff;margin:0;font-size:22px">FitLife Gym</h1>
                        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Password Reset</p>
                      </div>
                      <div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
                        <p style="color:#374151;font-size:15px">Hi <strong>%s</strong>,</p>
                        <p style="color:#6b7280;font-size:14px">We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                        <div style="text-align:center;margin:28px 0">
                          <a href="%s" style="background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block">Reset My Password</a>
                        </div>
                        <p style="color:#9ca3af;font-size:12px">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
                        <p style="color:#9ca3af;font-size:11px;margin-top:16px;word-break:break-all">Or copy this link: %s</p>
                        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">FitLife Gym – Stay fit, stay healthy!</p>
                      </div>
                    </div>
                    """.formatted(user.getFirstname(), resetLink, resetLink), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ Email send failed (password reset): " + e.getMessage());
        }
    }

    /** Welcome email — sent to new user on registration */
    public void sendWelcomeEmail(User user) {
        if (!isConfigured()) return;
        try {
            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "FitLife Gym");
            helper.setTo(user.getEmail());
            helper.setSubject("Welcome to FitLife Gym, " + user.getFirstname() + "!");
            helper.setText("""
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
                      <div style="background:#2563EB;padding:20px 24px;border-radius:8px 8px 0 0;text-align:center">
                        <h1 style="color:#fff;margin:0;font-size:22px">Welcome to FitLife Gym!</h1>
                        <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Your fitness journey starts now</p>
                      </div>
                      <div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
                        <p style="color:#374151;font-size:15px">Hi <strong>%s %s</strong>,</p>
                        <p style="color:#6b7280;font-size:14px">Your account has been successfully created. You can now log in and explore our membership plans.</p>
                        <div style="background:#eff6ff;border-left:4px solid #2563EB;padding:14px 18px;border-radius:6px;margin:20px 0">
                          <p style="color:#1e40af;font-size:13px;margin:0"><strong>Account Details</strong></p>
                          <p style="color:#374151;font-size:13px;margin:6px 0 0">Email: <strong>%s</strong></p>
                        </div>
                        <p style="color:#6b7280;font-size:13px">Browse our plans, track your payments, and manage your membership all in one place.</p>
                        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">FitLife Gym – Stay fit, stay healthy!</p>
                      </div>
                    </div>
                    """.formatted(user.getFirstname(), user.getLastname(), user.getEmail()), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ Email send failed (welcome): " + e.getMessage());
        }
    }

    /** Admin notification — sent to every admin who has notifEmail enabled */
    public void sendAdminPaymentAlert(User admin, User payer, Payment payment, Membership membership) {
        if (!isConfigured() || !admin.isNotifEmail()) return;
        try {
            var msg = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, "FitLife Gym");
            helper.setTo(admin.getEmail());
            helper.setSubject("FitLife Gym – New Payment from " + payer.getFirstname() + " " + payer.getLastname());

            helper.setText("""
                    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
                      <div style="background:#7c3aed;padding:20px 24px;border-radius:8px 8px 0 0;text-align:center">
                        <h1 style="color:#fff;margin:0;font-size:22px">FitLife Gym – Admin Alert</h1>
                        <p style="color:#ddd6fe;margin:4px 0 0;font-size:13px">New payment received</p>
                      </div>
                      <div style="background:#fff;padding:28px 24px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
                        <p style="color:#374151;font-size:15px">Hi <strong>%s</strong>,</p>
                        <p style="color:#6b7280;font-size:14px">A new payment has been submitted and requires your attention.</p>
                        <table style="width:100%%;border-collapse:collapse;margin:20px 0;font-size:14px">
                          <tr style="background:#f3f4f6"><td style="padding:10px 14px;color:#6b7280">Member</td><td style="padding:10px 14px;font-weight:600">%s %s (%s)</td></tr>
                          <tr><td style="padding:10px 14px;color:#6b7280">Reference</td><td style="padding:10px 14px;font-family:monospace;font-weight:bold">%s</td></tr>
                          <tr style="background:#f3f4f6"><td style="padding:10px 14px;color:#6b7280">Plan</td><td style="padding:10px 14px">%s</td></tr>
                          <tr><td style="padding:10px 14px;color:#6b7280">Method</td><td style="padding:10px 14px">%s</td></tr>
                          <tr style="background:#f3f4f6"><td style="padding:10px 14px;color:#374151;font-weight:700">Amount</td><td style="padding:10px 14px;color:#7c3aed;font-weight:900;font-size:18px">₱%,.2f</td></tr>
                          <tr><td style="padding:10px 14px;color:#6b7280">Status</td><td style="padding:10px 14px;font-weight:700;color:%s">%s</td></tr>
                        </table>
                        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center">Log in to the Admin Panel to manage this payment.</p>
                      </div>
                    </div>
                    """.formatted(
                    admin.getFirstname(),
                    payer.getFirstname(), payer.getLastname(), payer.getEmail(),
                    payment.getPaymentReference(),
                    membership.getName(),
                    payment.getPaymentMethod(),
                    payment.getAmount().doubleValue(),
                    "PENDING".equalsIgnoreCase(payment.getPaymentStatus()) ? "#D97706" : "#059669",
                    payment.getPaymentStatus()
            ), true);

            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠️ Email send failed (admin alert): " + e.getMessage());
        }
    }
}
