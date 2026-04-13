import type { NewsItem } from "@/types";

export function buildNewsletterHTML(
  title: string,
  articles: NewsItem[]
): string {
  const articleRows = articles
    .map(
      (article) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">
          ${article.source} &bull; ${article.publishedAt.toLocaleDateString("pt-BR")}
        </p>
        <a href="${article.url}" style="font-size: 16px; font-weight: 600; color: #0369a1; text-decoration: none;">
          ${article.title}
        </a>
        ${article.description ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: #374151;">${article.description}</p>` : ""}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0c4a6e; padding: 24px 32px;">
              <p style="margin: 0; font-size: 12px; color: #7dd3fc; text-transform: uppercase; letter-spacing: 1px;">Grupo Lorinvest</p>
              <h1 style="margin: 4px 0 0 0; font-size: 22px; color: #ffffff;">${title}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articleRows}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 16px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Voce esta recebendo este email por ser assinante da Newsletter Lorinvest.<br />
                <a href="{{unsubscribe_url}}" style="color: #0369a1;">Cancelar inscricao</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
