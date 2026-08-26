import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { Transaction } from "@/src/store/StoreContext";
import { formatDateTime, formatRupiah } from "./format";

function receiptHtml(tx: Transaction, storeName: string): string {
  const rows = tx.items
    .map(
      (it) => `
      <tr>
        <td>${it.name}<br/><span class="muted">${it.qty} x ${formatRupiah(it.sellPrice)}</span></td>
        <td class="right">${formatRupiah(it.sellPrice * it.qty)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }
    body { padding: 24px; color: #1A1412; max-width: 380px; margin: 0 auto; }
    h1 { text-align:center; font-size: 22px; margin: 0 0 2px; }
    .center { text-align:center; }
    .muted { color:#8a7d75; font-size: 12px; }
    hr { border: none; border-top: 1px dashed #c2b2a9; margin: 14px 0; }
    table { width:100%; border-collapse: collapse; }
    td { padding: 6px 0; vertical-align: top; font-size: 14px; }
    .right { text-align: right; white-space: nowrap; }
    .total-row td { font-size: 16px; font-weight: 700; padding-top: 10px; }
    .big { font-size: 18px; font-weight: 800; }
    .thanks { text-align:center; margin-top: 18px; font-size: 13px; color:#8a7d75; }
  </style></head><body>
    <h1>${storeName}</h1>
    <p class="center muted">Struk Belanja</p>
    <p class="center muted">${formatDateTime(tx.createdAt)}<br/>No: ${tx.id.toUpperCase()}</p>
    <hr/>
    <table>${rows}</table>
    <hr/>
    <table>
      <tr class="total-row"><td>Total</td><td class="right big">${formatRupiah(tx.subtotal)}</td></tr>
      <tr><td>Tunai</td><td class="right">${formatRupiah(tx.paid)}</td></tr>
      <tr><td>Kembalian</td><td class="right">${formatRupiah(tx.change)}</td></tr>
    </table>
    <p class="thanks">Terima kasih telah berbelanja 🙏<br/>Barang yang sudah dibeli tidak dapat ditukar</p>
  </body></html>`;
}

export async function printReceipt(tx: Transaction, storeName: string): Promise<void> {
  await Print.printAsync({ html: receiptHtml(tx, storeName) });
}

export async function shareReceipt(tx: Transaction, storeName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: receiptHtml(tx, storeName) });
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Struk Belanja" });
  }
}
