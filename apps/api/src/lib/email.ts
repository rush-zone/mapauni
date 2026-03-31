import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || 'MapaUni <noreply@fatrote.resend.app>'

export async function sendNewLeadEmail({
  to,
  universityName,
  studentName,
  studentEmail,
  studentPhone,
  courseName,
  message,
}: {
  to: string
  universityName: string
  studentName: string
  studentEmail: string
  studentPhone: string
  courseName?: string
  message?: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Novo lead recebido — ${studentName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#1e3a8a;margin-bottom:4px">Novo interesse recebido!</h2>
        <p style="color:#6b7280;margin-top:0">${universityName}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6b7280;width:140px">Nome</td><td style="padding:8px 0;font-weight:600">${studentName}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${studentEmail}" style="color:#1e3a8a">${studentEmail}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Telefone</td><td style="padding:8px 0">${studentPhone}</td></tr>
          ${courseName ? `<tr><td style="padding:8px 0;color:#6b7280">Curso</td><td style="padding:8px 0">${courseName}</td></tr>` : ''}
          ${message ? `<tr><td style="padding:8px 0;color:#6b7280;vertical-align:top">Mensagem</td><td style="padding:8px 0">${message}</td></tr>` : ''}
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
        <a href="${process.env.FRONTEND_URL}/dashboard/leads" style="background:#1e3a8a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Ver no Dashboard</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">MapaUni — Plataforma de conexão entre alunos e universidades</p>
      </div>
    `,
  })
}
