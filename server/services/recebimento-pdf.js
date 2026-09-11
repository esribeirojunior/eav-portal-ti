import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const OK_RE = /^(ok|sim|em bom estado)$/i;

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const dt = new Date(String(d).length <= 10 ? d + 'T00:00:00' : d);
    return dt.toLocaleDateString('pt-BR');
  } catch {
    return String(d);
  }
};

const TESTS = [
  ['funcionando', 'Funcionando'],
  ['teste_carregador', 'Carregador'],
  ['teste_cabo', 'Cabo do Carregador'],
  ['teste_rede', 'Rede'],
  ['teste_bluetooth', 'Bluetooth'],
  ['teste_teclado', 'Teclado'],
  ['teste_portas', 'Portas'],
  ['estado_capa', 'Capa Acrílica'],
];

const PHOTOS = [
  ['foto_tampa', 'Tampa'],
  ['foto_base', 'Base'],
  ['foto_teclado', 'Teclado'],
  ['foto_serie', 'Nº Série'],
  ['foto_tela', 'Tela'],
  ['foto_lateral_dir', 'Lateral Direita'],
  ['foto_lateral_esq', 'Lateral Esquerda'],
  ['foto_extra1', 'Extra 01'],
  ['foto_extra2', 'Extra 02'],
];

// Gera o laudo em PDF (Buffer). Le as fotos do disco (uploadsDir) e embute.
export function buildRecebimentoPdf(rec, uploadsDir) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const m = doc.page.margin;
      const contentW = pageW - m * 2;
      const bottom = doc.page.height - m;

      const reprovado = /reprovado/i.test(rec.resultado || '');
      const avarias = /avarias/i.test(rec.resultado || '');
      const rColor = reprovado ? '#dc2626' : avarias ? '#b45309' : '#059669';
      const rBg = reprovado ? '#fde2e2' : avarias ? '#fdf0d5' : '#d7f5e6';

      // --- Cabecalho ---
      doc.rect(0, 0, pageW, 92).fill('#0a3d62');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('Recebimento de Equipamento', m, 30);
      doc.font('Helvetica').fontSize(10).fillColor('#cbd5e1').text('Controle de Equipamentos  ·  TI  ·  Escola Americana de Vitoria', m, 56);
      doc.fillColor('#000000');

      let y = 112;

      // --- Selo de resultado ---
      doc.font('Helvetica-Bold').fontSize(11);
      const resultText = (rec.resultado || '—').toUpperCase();
      const bw = doc.widthOfString(resultText) + 24;
      doc.roundedRect(m, y, bw, 24, 6).fill(rBg);
      doc.fillColor(rColor).text(resultText, m + 12, y + 7);
      doc.fillColor('#000000');
      y += 42;

      // --- Secao helper ---
      const sectionTitle = (title) => {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#0a3d62').text(title.toUpperCase(), m, y);
        y += 6;
        doc.moveTo(m, y + 10).lineTo(m + contentW, y + 10).lineWidth(1).strokeColor('#e2e8f0').stroke();
        y += 18;
        doc.fillColor('#000000');
      };

      // pares label/valor em 2 colunas
      const pairs = (items) => {
        const colW = contentW / 2;
        items.forEach((it, i) => {
          const col = i % 2;
          const x = m + col * colW;
          if (col === 0 && i > 0) y += 34;
          doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(String(it[0]).toUpperCase(), x, y);
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(it[1] || '—', x, y + 11, { width: colW - 12 });
        });
        y += 34 + 8;
        doc.fillColor('#000000');
      };

      sectionTitle('Dados do Recebimento');
      pairs([
        ['Aluno', rec.user_name],
        ['Serie/Turma', rec.serie_turma],
        ['E-mail', rec.user_email],
        ['Responsavel', rec.responsavel_email],
        ['Equipamento', [rec.marca, rec.modelo].filter(Boolean).join(' ')],
        ['No de Serie', rec.serial_number],
        ['Patrimonio', rec.device_tag],
        ['Analista', rec.analista_email],
        ['Data de Recebimento', fmtDate(rec.data_recebimento)],
        ['Data de Verificacao', fmtDate(rec.data_verificacao)],
      ]);

      // --- Testes (tabela simples) ---
      sectionTitle('Testes Realizados');
      TESTS.forEach(([key, label]) => {
        const val = rec[key] || '—';
        const ok = OK_RE.test(String(val).trim());
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text(label, m, y);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(ok ? '#059669' : '#dc2626').text(val, m + 250, y);
        y += 18;
      });
      doc.fillColor('#000000');
      y += 8;

      // --- Observacoes ---
      if (rec.observacoes) {
        sectionTitle('Observacoes');
        doc.font('Helvetica').fontSize(10).fillColor('#334155').text(rec.observacoes, m, y, { width: contentW });
        y = doc.y + 12;
        doc.fillColor('#000000');
      }

      // --- Fotos ---
      const photoFiles = PHOTOS.map(([key, label]) => {
        const url = rec[key];
        if (!url) return null;
        const file = path.join(uploadsDir, path.basename(String(url)));
        return fs.existsSync(file) ? { file, label } : null;
      }).filter(Boolean);

      if (photoFiles.length > 0) {
        if (y > bottom - 40) { doc.addPage(); y = m; }
        sectionTitle('Registro Fotografico');
        const cols = 2;
        const gap = 16;
        const cellW = (contentW - gap) / cols;
        const cellH = 150;
        photoFiles.forEach((p, i) => {
          const col = i % cols;
          if (col === 0 && (y + cellH + 20) > bottom) { doc.addPage(); y = m; }
          const x = m + col * (cellW + gap);
          try {
            doc.image(p.file, x, y, { fit: [cellW, cellH], align: 'center', valign: 'center' });
          } catch {
            doc.rect(x, y, cellW, cellH).strokeColor('#e2e8f0').stroke();
          }
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text(p.label.toUpperCase(), x, y + cellH + 3, { width: cellW, align: 'center' });
          if (col === cols - 1) y += cellH + 26;
        });
        if (photoFiles.length % cols !== 0) y += cellH + 26;
        doc.fillColor('#000000');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
