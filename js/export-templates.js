/**
 * ENGINE XUẤT BIỂU MẪU & IN ẤN CHUẨN QUY CHUẨN
 * Mẫu 26 (Phiếu nhập, Phiếu xuất - PNX-KH/QN17)
 * Mẫu 09 (Sổ theo dõi vật chất quân nhu - STD-KH/QN17)
 * Mẫu 1.6 (Báo cáo kiểm kê 0h ngày 01/7 - 01/1 - Phụ lục 1 & 2)
 */

class ExportTemplates {
  constructor() {
    this.db = window.warehouseDB;
  }

  // Chuyển số thành chữ tiếng Việt cho mục Thành tiền
  formatNumber(n) {
    return new Intl.NumberFormat("vi-VN").format(n || 0);
  }

  formatDateVN(dStr) {
    if (!dStr) return "……/……/20…";
    const d = new Date(dStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  numberToWordsVN(total) {
    total = Math.round(total);
    if (total === 0) return "Không đồng";
    const units = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
    const nums = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    function readTriple(n, showZero) {
      let h = Math.floor(n / 100);
      let t = Math.floor((n % 100) / 10);
      let u = n % 10;
      let res = "";
      if (h > 0 || showZero) {
        res += nums[h] + " trăm ";
      }
      if (t > 1) {
        res += nums[t] + " mươi ";
        if (u === 1) res += "mốt ";
        else if (u === 5) res += "lăm ";
        else if (u > 0) res += nums[u] + " ";
      } else if (t === 1) {
        res += "mười ";
        if (u === 1) res += "một ";
        else if (u === 5) res += "lăm ";
        else if (u > 0) res += nums[u] + " ";
      } else if (u > 0) {
        if (h > 0 || showZero) res += "lẻ ";
        res += nums[u] + " ";
      }
      return res;
    }

    let str = "";
    let i = 0;
    while (total > 0) {
      let trip = total % 1000;
      if (trip > 0) {
        let tripStr = readTriple(trip, total >= 1000);
        str = tripStr + units[i] + (str ? " " + str : "");
      }
      total = Math.floor(total / 1000);
      i++;
    }

    str = str.trim();
    return str.charAt(0).toUpperCase() + str.slice(1) + " đồng chẵn.";
  }

  // Phẩm cấp hiển thị
  getQualityLabel(q) {
    const map = {
      Cap1: "Cấp 1",
      Cap2: "Cấp 2",
      Cap3: "Cấp 3",
      Cap4: "Cấp 4",
      Cap5: "Cấp 5"
    };
    return map[q] || "Cấp 1";
  }

  // =========================================================================
  // 1. MẪU 26: PHIẾU NHẬP KHO (Mẫu 26: PNX-KH/QN17)
  // =========================================================================

  getReceiptHTML(trx) {
    const settings = this.db.getSettings();
    const items = trx.items || [];
    const totalAmount = items.reduce((sum, it) => sum + (it.amount || (it.qtyActual * it.price) || 0), 0);
    const amountInWords = this.numberToWordsVN(totalAmount);

    let rowsHTML = "";
    items.forEach((it, idx) => {
      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${it.productName || it.name}</b><br><small style="color: #444;">${it.productCode || ""}</small></td>
          <td style="text-align: center;">${it.unit}</td>
          <td style="text-align: center;"><span class="badge-cap ${it.quality?.toLowerCase() || 'cap-1'}">${this.getQualityLabel(it.quality)}</span></td>
          <td style="text-align: right;">${this.formatNumber(it.qtyRequired)}</td>
          <td style="text-align: right; font-weight: bold;">${this.formatNumber(it.qtyActual)}</td>
          <td style="text-align: right;">${this.formatNumber(it.price)}</td>
          <td style="text-align: right; font-weight: bold;">${this.formatNumber(it.amount || it.qtyActual * it.price)}</td>
          <td>${it.notes || ""}</td>
        </tr>
      `;
    });

    return `
      <div class="print-sheet">
        <div class="doc-header-grid">
          <div class="doc-header-left">
            <div style="font-weight: bold; text-transform: uppercase;">${settings.unitName}</div>
            <div style="font-weight: bold;">${trx.receiverUnit || settings.subUnit}</div>
            <div>Số: <b>${trx.code || "PN-……"}</b></div>
            <div>Quyển số: ${trx.bookNo || "01/2026"}</div>
          </div>
          <div class="doc-header-right">
            <div style="font-weight: bold;">Mẫu 26: PNX-KH/QN17</div>
            <div>Ngày lập: ${this.formatDateVN(trx.date)}</div>
            <div style="font-style: italic;">Có giá trị hết ngày: ${this.formatDateVN(trx.validUntil)}</div>
          </div>
        </div>

        <div class="doc-title-block">
          <div class="doc-title">PHIẾU NHẬP KHO</div>
          <div class="doc-subtitle">Kho: ${trx.warehouseLocation || settings.warehouseName}</div>
        </div>

        <div class="doc-meta">
          <table style="width: 100%; border-collapse: collapse; line-height: 1.6;">
            <tr>
              <td style="width: 50%;"><b>Nhập của:</b> ${trx.partnerName || "Đơn vị cung cấp"}</td>
              <td style="width: 50%;"><b>Địa chỉ:</b> ${trx.partnerAddress || "Theo hợp đồng"}</td>
            </tr>
            <tr>
              <td><b>Theo văn bản/HĐ số:</b> ${trx.contractNo || "Lệnh điều động"}</td>
              <td><b>Phương tiện vận chuyển:</b> ${trx.transportBy || "Bên giao vận chuyển"}</td>
            </tr>
            <tr>
              <td colspan="2"><b>Lý do nhập kho:</b> ${trx.notes || "Nhập phục vụ công tác theo kế hoạch"}</td>
            </tr>
          </table>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th rowspan="2" style="width: 35px;">TT</th>
              <th rowspan="2">Tên, quy cách, ký mã hiệu vật tư</th>
              <th rowspan="2" style="width: 60px;">Đơn vị tính</th>
              <th rowspan="2" style="width: 65px;">Phẩm cấp</th>
              <th colspan="2">Số lượng</th>
              <th rowspan="2" style="width: 85px;">Giá lẻ (đ)</th>
              <th rowspan="2" style="width: 105px;">Thành tiền (đ)</th>
              <th rowspan="2" style="width: 100px;">Ghi chú</th>
            </tr>
            <tr>
              <th style="width: 70px;">Phải nhập</th>
              <th style="width: 70px;">Thực nhập</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
            <tr style="font-weight: bold; background-color: #f9f9f9;">
              <td colspan="4" style="text-align: center;">CỘNG TỔNG CỘNG</td>
              <td style="text-align: right;">${this.formatNumber(items.reduce((s, it) => s + (it.qtyRequired || 0), 0))}</td>
              <td style="text-align: right;">${this.formatNumber(items.reduce((s, it) => s + (it.qtyActual || 0), 0))}</td>
              <td></td>
              <td style="text-align: right; color: #1b5e20;">${this.formatNumber(totalAmount)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div style="margin: 10px 0; line-height: 1.6;">
          <div>- Tổng nhập: <b>${items.length}</b> mặt hàng.</div>
          <div>- Tổng số tiền (bằng số): <b>${this.formatNumber(totalAmount)} đồng</b>.</div>
          <div>- Bằng chữ: <i>${amountInWords}</i></div>
          <div>- Ngày giao nhận: ${this.formatDateVN(trx.date)}</div>
        </div>

        <div class="doc-signatures">
          <div class="doc-sign-box">
            <div class="role">Người viết phiếu</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerCreator || settings.officerInCharge}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Người giao hàng</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerDeliverer || "Người giao"}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Thủ kho (Người nhận)</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerReceiver || settings.storekeeper}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Người duyệt</div>
            <div class="note">(Ký, họ tên, đóng dấu)</div>
            <div class="name">${trx.signerApprover || settings.chiefLogistics}</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 2. MẪU 26 / BIỂU SS14-QN10: PHIẾU XUẤT KHO
  // =========================================================================

  getIssueHTML(trx) {
    const settings = this.db.getSettings();
    const items = trx.items || [];
    const totalAmount = items.reduce((sum, it) => sum + (it.amount || (it.qtyActual * it.price) || 0), 0);
    const amountInWords = this.numberToWordsVN(totalAmount);

    let rowsHTML = "";
    items.forEach((it, idx) => {
      rowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${it.productName || it.name}</b><br><small style="color: #444;">${it.productCode || ""}</small></td>
          <td style="text-align: center;">${it.unit}</td>
          <td style="text-align: center;"><span class="badge-cap ${it.quality?.toLowerCase() || 'cap-1'}">${this.getQualityLabel(it.quality)}</span></td>
          <td style="text-align: right;">${this.formatNumber(it.qtyRequired)}</td>
          <td style="text-align: right; font-weight: bold;">${this.formatNumber(it.qtyActual)}</td>
          <td style="text-align: right;">${this.formatNumber(it.price)}</td>
          <td style="text-align: right; font-weight: bold;">${this.formatNumber(it.amount || it.qtyActual * it.price)}</td>
          <td>${it.notes || ""}</td>
        </tr>
      `;
    });

    return `
      <div class="print-sheet">
        <div class="doc-header-grid">
          <div class="doc-header-left">
            <div style="font-weight: bold; text-transform: uppercase;">${settings.unitName}</div>
            <div style="font-weight: bold;">${settings.department}</div>
            <div>Số: <b>${trx.code || "PX-……"}</b></div>
            <div>Quyển số: ${trx.bookNo || "01/2026"}</div>
          </div>
          <div class="doc-header-right">
            <div style="font-weight: bold;">Biểu SS14-QN10 (Mẫu 26)</div>
            <div>Ngày lập: ${this.formatDateVN(trx.date)}</div>
            <div style="font-style: italic;">Có giá trị hết ngày: ${this.formatDateVN(trx.validUntil)}</div>
          </div>
        </div>

        <div class="doc-title-block">
          <div class="doc-title">PHIẾU XUẤT KHO</div>
          <div class="doc-subtitle">Kho: ${trx.warehouseLocation || settings.warehouseName}</div>
        </div>

        <div class="doc-meta">
          <table style="width: 100%; border-collapse: collapse; line-height: 1.6;">
            <tr>
              <td style="width: 50%;"><b>Họ, tên người nhận:</b> ${trx.receiverName || "Cán bộ nhận hàng"}</td>
              <td style="width: 50%;"><b>Đơn vị (Bộ phận):</b> ${trx.receiverUnit || trx.partnerName}</td>
            </tr>
            <tr>
              <td><b>Theo lệnh xuất/HĐ số:</b> ${trx.contractNo || "Kế hoạch hậu cần"}</td>
              <td><b>Địa điểm nhận tại kho:</b> ${trx.warehouseLocation || settings.warehouseName}</td>
            </tr>
            <tr>
              <td colspan="2"><b>Lý do xuất kho:</b> ${trx.reason || trx.notes || "Cấp phát vật chất theo nhiệm vụ"}</td>
            </tr>
          </table>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th rowspan="2" style="width: 35px;">TT</th>
              <th rowspan="2">Tên, quy cách, ký mã hiệu vật tư, sản phẩm</th>
              <th rowspan="2" style="width: 60px;">Đơn vị tính</th>
              <th rowspan="2" style="width: 65px;">Phẩm cấp</th>
              <th colspan="2">Số lượng</th>
              <th rowspan="2" style="width: 85px;">Giá lẻ (đ)</th>
              <th rowspan="2" style="width: 105px;">Thành tiền (đ)</th>
              <th rowspan="2" style="width: 100px;">Ghi chú</th>
            </tr>
            <tr>
              <th style="width: 70px;">Phải xuất</th>
              <th style="width: 70px;">Thực xuất</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
            <tr style="font-weight: bold; background-color: #f9f9f9;">
              <td colspan="4" style="text-align: center;">CỘNG TỔNG CỘNG</td>
              <td style="text-align: right;">${this.formatNumber(items.reduce((s, it) => s + (it.qtyRequired || 0), 0))}</td>
              <td style="text-align: right;">${this.formatNumber(items.reduce((s, it) => s + (it.qtyActual || 0), 0))}</td>
              <td></td>
              <td style="text-align: right; color: #b91c1c;">${this.formatNumber(totalAmount)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div style="margin: 10px 0; line-height: 1.6;">
          <div>- Tổng xuất: <b>${items.length}</b> mặt hàng.</div>
          <div>- Tổng thành tiền (bằng số): <b>${this.formatNumber(totalAmount)} đồng</b>.</div>
          <div>- Bằng chữ: <i>${amountInWords}</i></div>
          <div>- Ngày giao nhận: ${this.formatDateVN(trx.date)}</div>
        </div>

        <div class="doc-signatures">
          <div class="doc-sign-box">
            <div class="role">Người viết phiếu</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerCreator || settings.officerInCharge}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Người nhận</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerReceiver || trx.receiverName}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Thủ kho</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerStorekeeper || settings.storekeeper}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Chủ nhiệm Hậu cần</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${trx.signerChief || settings.chiefLogistics}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Thủ trưởng duyệt</div>
            <div class="note">(Ký, họ tên, đóng dấu)</div>
            <div class="name">${trx.signerApprover || settings.commander}</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. MẪU 09: SỔ THEO DÕI VẬT CHẤT QUÂN NHU (STD-KH/QN17)
  // =========================================================================

  getLedgerHTML(ledgerData, fromDate, toDate) {
    const settings = this.db.getSettings();
    let sectionsHTML = "";

    ledgerData.forEach((ledgerItem, idx) => {
      const p = ledgerItem.product;
      let rowsHTML = `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td colspan="3" style="text-align: center;">SỐ DƯ ĐẦU KỲ</td>
          <td></td>
          <td></td>
          <td></td>
          <td style="text-align: right; color: #0d47a1;">${this.formatNumber(ledgerItem.openingStock)}</td>
          <td>Số dư lũy kế chuyển sang</td>
        </tr>
      `;

      if (ledgerItem.entries.length === 0) {
        rowsHTML += `
          <tr>
            <td colspan="8" style="text-align: center; color: #888; font-style: italic; padding: 12px;">Trong kỳ không có phát sinh giao dịch nhập/xuất</td>
          </tr>
        `;
      } else {
        ledgerItem.entries.forEach(e => {
          rowsHTML += `
            <tr>
              <td style="text-align: center;">${e.docNo}</td>
              <td style="text-align: center;">${this.formatDateVN(e.date)}</td>
              <td>${e.partner}</td>
              <td style="text-align: center;"><span class="badge-cap ${e.quality?.toLowerCase() || 'cap-1'}">${this.getQualityLabel(e.quality)}</span></td>
              <td style="text-align: right; font-weight: bold; color: #16a34a;">${e.inQty ? this.formatNumber(e.inQty) : "-"}</td>
              <td style="text-align: right; font-weight: bold; color: #dc2626;">${e.outQty ? this.formatNumber(e.outQty) : "-"}</td>
              <td style="text-align: right; font-weight: bold;">${this.formatNumber(e.balance)}</td>
              <td>${e.notes || ""}</td>
            </tr>
          `;
        });
      }

      rowsHTML += `
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="3" style="text-align: center;">TỔNG CỘNG PHÁT SINH TRONG KỲ</td>
          <td></td>
          <td style="text-align: right; color: #16a34a;">${this.formatNumber(ledgerItem.periodIn)}</td>
          <td style="text-align: right; color: #dc2626;">${this.formatNumber(ledgerItem.periodOut)}</td>
          <td></td>
          <td></td>
        </tr>
        <tr style="background-color: #e2e8f0; font-weight: bold; font-size: 11pt;">
          <td colspan="3" style="text-align: center;">SỐ DƯ TỒN CUỐI KỲ</td>
          <td></td>
          <td></td>
          <td></td>
          <td style="text-align: right; color: #1b5e20;">${this.formatNumber(ledgerItem.closingStock)}</td>
          <td>Trị giá: ${this.formatNumber(ledgerItem.closingStock * (p.price || 0))} đ</td>
        </tr>
      `;

      sectionsHTML += `
        <div style="margin-bottom: 30px; page-break-after: always;">
          <div style="border-bottom: 2px solid #1b5e20; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <span style="background: #1b5e20; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 10pt; font-weight: bold;">Trang ${idx + 1}</span>
              <span style="font-size: 14pt; font-weight: bold; margin-left: 8px; text-transform: uppercase;">${p.name}</span>
              <span style="font-size: 11pt; color: #555; margin-left: 8px;">(Mã: ${p.code})</span>
            </div>
            <div style="text-align: right; font-size: 11pt;">
              <b>ĐVT:</b> ${p.unit} | <b>Giá lẻ:</b> ${this.formatNumber(p.price)} đ
            </div>
          </div>

          <table class="doc-table">
            <thead>
              <tr>
                <th colspan="2" style="width: 140px;">Lệnh / Chứng từ</th>
                <th rowspan="2">Đơn vị giao nhận / Diễn giải</th>
                <th rowspan="2" style="width: 70px;">Phẩm cấp</th>
                <th rowspan="2" style="width: 80px;">Nhập</th>
                <th rowspan="2" style="width: 80px;">Xuất</th>
                <th rowspan="2" style="width: 90px;">Tồn kho</th>
                <th rowspan="2" style="width: 120px;">Ghi chú</th>
              </tr>
              <tr>
                <th style="width: 80px;">Số</th>
                <th style="width: 60px;">Ngày</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      `;
    });

    return `
      <div class="print-sheet landscape">
        <div class="doc-header-grid">
          <div class="doc-header-left">
            <div style="font-weight: bold; text-transform: uppercase;">${settings.unitName}</div>
            <div style="font-weight: bold;">${settings.department}</div>
            <div>Quyển số: 01/2026</div>
          </div>
          <div class="doc-header-right">
            <div style="font-weight: bold;">Mẫu 09: STD-KH/QN17</div>
            <div>Kho: ${settings.warehouseName}</div>
            <div>Năm: 2026</div>
          </div>
        </div>

        <div class="doc-title-block">
          <div class="doc-title">SỔ THEO DÕI VẬT CHẤT QUÂN NHU TẠI KHO</div>
          <div class="doc-subtitle">
            ${fromDate ? `Từ ngày ${this.formatDateVN(fromDate)} ` : ""} 
            ${toDate ? `đến ngày ${this.formatDateVN(toDate)}` : "Toàn bộ thời gian"}
          </div>
        </div>

        ${sectionsHTML}

        <div class="doc-signatures">
          <div class="doc-sign-box">
            <div class="role">Thủ kho lập sổ</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${settings.storekeeper}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Trợ lý nghiệp vụ</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${settings.officerInCharge}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Chủ nhiệm Hậu cần duyệt</div>
            <div class="note">(Ký, họ tên, đóng dấu)</div>
            <div class="name">${settings.chiefLogistics}</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. MẪU 1.6: BÁO CÁO KIỂM KÊ VẬT CHẤT TRANG BỊ QUÂN NHU
  // =========================================================================

  getInventoryHTML(inv, filterType = "ALL") {
    const settings = this.db.getSettings();
    const records = inv.records || [];

    // Tách theo thường xuyên hoặc dự trữ SSCĐ
    const txRecords = records.filter(r => r.type === "TXuyen" || !r.type);
    const dtRecords = records.filter(r => r.type === "DTSSCD");

    function renderTable(list, title, isDT = false) {
      let rows = "";
      let totalAmount = 0;
      let totalQty = 0;

      list.forEach((r, idx) => {
        const amt = r.amount || (r.actualQty * (r.price || 0));
        totalAmount += amt;
        totalQty += r.actualQty;

        rows += `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="font-family: monospace;">${r.productCode || ""}</td>
            <td><b>${r.productName}</b></td>
            <td style="text-align: center;">${r.unit}</td>
            <td style="text-align: right;">${new Intl.NumberFormat("vi-VN").format(r.price || 0)}</td>
            <td style="text-align: right;">${r.qtyPrevious || 0}</td>
            <td style="text-align: right; color: #16a34a;">${r.increaseTotal || 0}</td>
            <td style="text-align: right; color: #dc2626;">${r.decreaseTotal || 0}</td>
            <td style="text-align: right;">${r.bookQty || 0}</td>
            <td style="text-align: right; font-weight: bold;">${r.actualQty || 0}</td>
            <td style="text-align: right; font-weight: bold;">${new Intl.NumberFormat("vi-VN").format(amt)}</td>
            <td style="text-align: right; color: green;">${r.diffOver || 0}</td>
            <td style="text-align: right; color: red;">${r.diffUnder || 0}</td>
            <td style="text-align: right;">${r.quality1 || 0}</td>
            <td style="text-align: right;">${r.quality2 || 0}</td>
            <td style="text-align: right;">${r.quality3 || 0}</td>
            <td style="text-align: right;">${r.quality4 || 0}</td>
            <td>${r.actionPlan || r.notes || ""}</td>
          </tr>
        `;
      });

      return `
        <div style="margin: 20px 0;">
          <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase; margin-bottom: 6px; color: #1b5e20;">
            ${title}
          </div>
          <table class="doc-table" style="font-size: 9.5pt;">
            <thead>
              <tr>
                <th rowspan="3" style="width: 25px;">TT</th>
                <th rowspan="3">Mã số</th>
                <th rowspan="3">Danh mục vật tư</th>
                <th rowspan="3" style="width: 40px;">ĐVT</th>
                <th rowspan="3" style="width: 65px;">Đơn giá</th>
                <th rowspan="3" style="width: 45px;">Số lượng kỳ trước</th>
                <th colspan="2">Tăng/Giảm trong kỳ</th>
                <th colspan="3">Số lượng kỳ kiểm kê</th>
                <th colspan="2">Chênh lệch</th>
                <th colspan="4">Phân cấp chất lượng</th>
                <th rowspan="3" style="width: 120px;">Đề xuất xử lý / Ghi chú</th>
              </tr>
              <tr>
                <th rowspan="2" style="width: 45px;">Tăng</th>
                <th rowspan="2" style="width: 45px;">Giảm</th>
                <th rowspan="2" style="width: 50px;">Sổ sách</th>
                <th colspan="2">Thực tế</th>
                <th rowspan="2" style="width: 35px;">Thừa</th>
                <th rowspan="2" style="width: 35px;">Thiếu</th>
                <th rowspan="2" style="width: 35px;">Cấp 1</th>
                <th rowspan="2" style="width: 35px;">Cấp 2</th>
                <th rowspan="2" style="width: 35px;">Cấp 3</th>
                <th rowspan="2" style="width: 35px;">Cấp 4</th>
              </tr>
              <tr>
                <th style="width: 45px;">Số lượng</th>
                <th style="width: 80px;">Thành tiền (đ)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr style="font-weight: bold; background: #f2f2f2;">
                <td colspan="5" style="text-align: center;">TỔNG CỘNG</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td style="text-align: right;">${new Intl.NumberFormat("vi-VN").format(totalQty)}</td>
                <td style="text-align: right; color: #1b5e20;">${new Intl.NumberFormat("vi-VN").format(totalAmount)}</td>
                <td colspan="6"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    let bodyHTML = "";
    if (filterType === "ALL" || filterType === "TXuyen") {
      bodyHTML += renderTable(txRecords, "Phụ lục 2: Vật chất, trang bị Quân nhu thường xuyên");
    }
    if (filterType === "ALL" || filterType === "DTSSCD") {
      bodyHTML += renderTable(dtRecords, "Phụ lục 1: Vật chất, trang bị Quân nhu Dự trữ SSCĐ", true);
    }

    return `
      <div class="print-sheet landscape">
        <div class="doc-header-grid">
          <div class="doc-header-left">
            <div style="font-weight: bold; text-transform: uppercase;">${settings.unitName}</div>
            <div style="font-weight: bold;">HỘI ĐỒNG KIỂM KÊ VẬT CHẤT</div>
            <div>Số: <b>${inv.code || "BC-KK"}</b></div>
          </div>
          <div class="doc-header-right">
            <div style="font-weight: bold;">Mẫu số 1.6 / QN</div>
            <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 10pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>

        <div class="doc-title-block">
          <div class="doc-title">${inv.title || "BÁO CÁO KẾT QUẢ TỔNG HỢP KIỂM KÊ VẬT CHẤT, TRANG BỊ QUÂN NHU"}</div>
          <div class="doc-subtitle">Thời điểm: 0h ngày ${this.formatDateVN(inv.date)} - Địa điểm: ${settings.warehouseName}</div>
        </div>

        <div class="doc-meta" style="line-height: 1.5; font-size: 11pt;">
          <div>- Chủ tịch Hội đồng kiểm kê: <b>${inv.committeeHead || settings.chiefLogistics}</b></div>
          <div>- Các thành viên: <b>${inv.committeeMembers || "Trợ lý quân nhu, Thủ kho, Ban thanh tra"}</b></div>
          <div>- Đánh giá sơ bộ: <i>${inv.conclusion || "Số lượng cơ bản khớp sổ sách, bảo quản đúng quy cách."}</i></div>
        </div>

        ${bodyHTML}

        <div class="doc-signatures" style="margin-top: 30px;">
          <div class="doc-sign-box">
            <div class="role">Thủ kho</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${settings.storekeeper}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Trợ lý Quân nhu tổng hợp</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${settings.officerInCharge}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Chủ tịch Hội đồng kiểm kê</div>
            <div class="note">(Ký, họ tên)</div>
            <div class="name">${inv.committeeHead || settings.chiefLogistics}</div>
          </div>
          <div class="doc-sign-box">
            <div class="role">Chỉ huy đơn vị phê duyệt</div>
            <div class="note">(Ký, họ tên, đóng dấu)</div>
            <div class="name">${settings.commander}</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // XUẤT FILE EXCEL & WORD
  // =========================================================================

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Xuất file Excel định dạng HTML Spreadsheet (mở đẹp trong mọi phiên bản Excel)
  exportToExcelHTML(htmlContent, fileName) {
    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>BieuMau</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 0.5pt solid #000; padding: 5px; vertical-align: middle; }
          th { background-color: #e2e8f0; font-weight: bold; text-align: center; }
          .title { font-size: 16pt; font-weight: bold; text-align: center; }
          .header { font-weight: bold; }
          .badge-cap { font-weight: bold; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    this.downloadFile("\uFEFF" + template, fileName, "application/vnd.ms-excel;charset=utf-8");
  }

  // Xuất file Word .doc
  exportToWordDoc(htmlContent, fileName) {
    const template = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          th, td { border: 1px solid #000; padding: 6px; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    this.downloadFile("\uFEFF" + template, fileName, "application/msword;charset=utf-8");
  }

  // In ấn trực tiếp qua Browser Print
  printDirect(htmlContent) {
    const printArea = document.getElementById("print-container");
    if (printArea) {
      printArea.innerHTML = htmlContent;
      window.print();
    } else {
      const w = window.open("", "_blank");
      w.document.write(`
        <html>
        <head>
          <title>In biểu mẫu</title>
          <link rel="stylesheet" href="css/style.css">
          <style>
            body { background: #fff; padding: 20px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${htmlContent}
        </body>
        </html>
      `);
      w.document.close();
    }
  }
}

// Khởi tạo global Export instance
window.exportTemplates = new ExportTemplates();
