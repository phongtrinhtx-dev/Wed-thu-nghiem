/**
 * CONTROLLER ỨNG DỤNG QUẢN LÝ KHO & BIỂU MẪU
 * Kết nối Database, Export Engine, xử lý sự kiện giao diện và tính toán
 */

class WarehouseApp {
  constructor() {
    this.db = window.warehouseDB;
    this.exporter = window.exportTemplates;
    this.currentTab = "tab-dashboard";
    this.currentPreviewHTML = "";
    this.currentPreviewFilename = "";

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.renderAll();
    this.initFeather();
  }

  initFeather() {
    if (window.feather) {
      window.feather.replace();
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => container.removeChild(toast), 300);
    }, 3500);
  }

  formatNumber(n) {
    return new Intl.NumberFormat("vi-VN").format(n || 0);
  }

  formatDate(dStr) {
    if (!dStr) return "";
    const d = new Date(dStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // --- TAB NAVIGATION ---
  switchTab(tabId) {
    this.currentTab = tabId;

    document.querySelectorAll(".menu-item").forEach(item => {
      item.classList.remove("active");
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      }
    });

    document.querySelectorAll(".tab-content").forEach(tab => {
      tab.classList.remove("active");
    });

    const activeEl = document.getElementById(tabId);
    if (activeEl) {
      activeEl.classList.add("active");
    }

    const titleMap = {
      "tab-dashboard": "Tổng quan kho hàng",
      "tab-receipts": "Quản lý Nhập kho (Mẫu 26)",
      "tab-issues": "Quản lý Xuất kho (Mẫu 26 / Biểu SS14)",
      "tab-ledger": "Sổ theo dõi vật chất (Mẫu 09)",
      "tab-inventory": "Báo cáo kiểm kê (Mẫu 1.6)",
      "tab-products": "Danh mục mặt hàng trong kho",
      "tab-export-center": "Menu xuất biểu mẫu & in ấn",
      "tab-settings": "Cài đặt & Sao lưu dữ liệu"
    };

    document.getElementById("topbar-title").textContent = titleMap[tabId] || "Quản lý kho";

    this.renderTab(tabId);
    this.initFeather();
  }

  renderAll() {
    this.renderDashboard();
    this.renderReceipts();
    this.renderIssues();
    this.renderProducts();
    this.renderLedgerFilter();
    this.renderInventoryPeriods();
    this.updateBadges();
  }

  renderTab(tabId) {
    switch (tabId) {
      case "tab-dashboard":
        this.renderDashboard();
        break;
      case "tab-receipts":
        this.renderReceipts();
        break;
      case "tab-issues":
        this.renderIssues();
        break;
      case "tab-ledger":
        this.renderLedger();
        break;
      case "tab-inventory":
        this.renderInventoryView();
        break;
      case "tab-products":
        this.renderProducts();
        break;
    }
  }

  updateBadges() {
    const products = this.db.getProducts();
    const transactions = this.db.getTransactions();
    const inCount = transactions.filter(t => t.type === "IN").length;
    const outCount = transactions.filter(t => t.type === "OUT").length;

    document.getElementById("badge-prod-count").textContent = products.length;
    document.getElementById("badge-in-count").textContent = inCount;
    document.getElementById("badge-out-count").textContent = outCount;
  }

  // =========================================================================
  // DASHBOARD
  // =========================================================================

  renderDashboard() {
    const stockList = this.db.calculateCurrentStock();
    const products = this.db.getProducts();
    const transactions = this.db.getTransactions();

    const totalStock = stockList.reduce((sum, s) => sum + s.totalQty, 0);
    const totalValue = stockList.reduce((sum, s) => sum + s.totalValue, 0);

    document.getElementById("stat-total-products").textContent = products.length;
    document.getElementById("stat-total-stock").textContent = this.formatNumber(totalStock);
    document.getElementById("stat-total-value").textContent = this.formatNumber(totalValue) + " đ";
    document.getElementById("stat-today-trx").textContent = transactions.length;

    // Quality breakdown
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
    stockList.forEach(s => {
      q1 += s.byQuality.Cap1 || 0;
      q2 += s.byQuality.Cap2 || 0;
      q3 += s.byQuality.Cap3 || 0;
      q4 += s.byQuality.Cap4 || 0;
    });

    const sumQ = q1 + q2 + q3 + q4 || 1;
    const pct1 = Math.round((q1 / sumQ) * 100);
    const pct2 = Math.round((q2 / sumQ) * 100);
    const pct3 = Math.round((q3 / sumQ) * 100);
    const pct4 = Math.max(0, 100 - pct1 - pct2 - pct3);

    const qContainer = document.getElementById("quality-progress-bars");
    qContainer.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span><b>Cấp 1</b> (Chất lượng tốt, mới 100%):</span>
          <span><b>${this.formatNumber(q1)}</b> (${pct1}%)</span>
        </div>
        <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
          <div style="width: ${pct1}%; height: 100%; background: #16a34a;"></div>
        </div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span><b>Cấp 2</b> (Đã qua sử dụng, còn tốt):</span>
          <span><b>${this.formatNumber(q2)}</b> (${pct2}%)</span>
        </div>
        <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
          <div style="width: ${pct2}%; height: 100%; background: #eab308;"></div>
        </div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span><b>Cấp 3</b> (Kém phẩm chất, cần sửa chữa):</span>
          <span><b>${this.formatNumber(q3)}</b> (${pct3}%)</span>
        </div>
        <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
          <div style="width: ${pct3}%; height: 100%; background: #f97316;"></div>
        </div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
          <span><b>Cấp 4</b> (Hư hỏng, đề nghị thanh lý/trả trên):</span>
          <span><b>${this.formatNumber(q4)}</b> (${pct4}%)</span>
        </div>
        <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
          <div style="width: ${pct4}%; height: 100%; background: #dc2626;"></div>
        </div>
      </div>
    `;

    // Stock Alerts
    const alertContainer = document.getElementById("stock-alerts-list");
    const lowStock = stockList.filter(s => s.totalQty <= (s.product.minStock || 10));
    const badQuality = stockList.filter(s => (s.byQuality.Cap3 + s.byQuality.Cap4) > 0);

    let alertHTML = "";
    if (lowStock.length > 0) {
      alertHTML += `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; display: flex; gap: 10px; align-items: center;">
          <span style="color: #dc2626; font-size: 20px;">⚠️</span>
          <div>
            <div style="font-weight: bold; color: #991b1b;">Có ${lowStock.length} mặt hàng sắp hết hoặc dưới mức tối thiểu:</div>
            <div style="font-size: 12px; color: #b91c1c;">
              ${lowStock.slice(0, 3).map(s => `${s.product.name} (Tồn: ${s.totalQty} ${s.product.unit})`).join(", ")}
              ${lowStock.length > 3 ? "..." : ""}
            </div>
          </div>
        </div>
      `;
    }

    if (badQuality.length > 0) {
      alertHTML += `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; display: flex; gap: 10px; align-items: center;">
          <span style="color: #d97706; font-size: 20px;">ℹ️</span>
          <div>
            <div style="font-weight: bold; color: #92400e;">Có ${badQuality.length} mặt hàng có phẩm cấp Cấp 3 hoặc Cấp 4:</div>
            <div style="font-size: 12px; color: #b45309;">
              Cần đưa vào kế hoạch kiểm kê để đề nghị điều đi hoặc xin thanh xử lý.
            </div>
          </div>
        </div>
      `;
    }

    if (!alertHTML) {
      alertHTML = `<div style="color: #15803d; padding: 10px; font-weight: 500;">✅ Tồn kho bảo đảm an toàn, không có cảnh báo nghiêm trọng.</div>`;
    }
    alertContainer.innerHTML = alertHTML;

    // Recent Transactions Table
    const tbody = document.querySelector("#tbl-recent-transactions tbody");
    const recentTrx = transactions.slice(0, 8);
    if (recentTrx.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 20px;">Chưa có giao dịch nào</td></tr>`;
    } else {
      tbody.innerHTML = recentTrx.map(t => {
        const isIN = t.type === "IN";
        const totalAmount = t.items?.reduce((s, it) => s + (it.amount || it.qtyActual * it.price || 0), 0) || 0;
        return `
          <tr>
            <td><b>${t.code}</b></td>
            <td><span class="badge" style="background: ${isIN ? '#e8f5e9; color: #1b5e20;' : '#fee2e2; color: #dc2626;'} font-weight: bold;">${isIN ? 'Nhập kho' : 'Xuất kho'}</span></td>
            <td>${this.formatDate(t.date)}</td>
            <td>${isIN ? (t.partnerName || "Nhà cung cấp") : (t.receiverUnit || t.receiverName || "Đơn vị")}</td>
            <td class="text-center">${t.items?.length || 0}</td>
            <td class="text-right font-bold" style="color: ${isIN ? '#1b5e20' : '#dc2626'};">${this.formatNumber(totalAmount)} đ</td>
            <td class="text-center">
              <button class="btn btn-outline btn-sm" onclick="app.previewTransaction('${t.id}')" title="Xem & In phiếu">
                <i data-feather="printer"></i> In
              </button>
              <button class="btn btn-success btn-sm" onclick="app.exportTransactionExcel('${t.id}')" title="Xuất Excel">
                <i data-feather="file-text"></i> Excel
              </button>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // =========================================================================
  // NHẬP KHO (MẪU 26)
  // =========================================================================

  renderReceipts() {
    const list = this.db.getTransactions().filter(t => t.type === "IN");
    const tbody = document.querySelector("#tbl-receipts tbody");

    const search = document.getElementById("search-receipts")?.value.toLowerCase().trim() || "";
    const fromDate = document.getElementById("receipt-filter-from")?.value;
    const toDate = document.getElementById("receipt-filter-to")?.value;

    const filtered = list.filter(t => {
      const matchSearch = !search || t.code?.toLowerCase().includes(search) || t.partnerName?.toLowerCase().includes(search);
      const matchFrom = !fromDate || new Date(t.date) >= new Date(fromDate);
      const matchTo = !toDate || new Date(t.date) <= new Date(toDate);
      return matchSearch && matchFrom && matchTo;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 24px; color: #888;">Không tìm thấy phiếu nhập kho nào phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((t, idx) => {
      const totalAmount = t.items?.reduce((s, it) => s + (it.amount || it.qtyActual * it.price || 0), 0) || 0;
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${t.code}</b></td>
          <td>${t.bookNo || "01/2026"}</td>
          <td>${this.formatDate(t.date)}</td>
          <td><b>${t.partnerName || "Cung cấp"}</b></td>
          <td>${t.contractNo || "Kế hoạch"}</td>
          <td class="text-center"><span class="badge" style="background: #e2e8f0; color: #1e293b;">${t.items?.length || 0} mặt hàng</span></td>
          <td class="text-right font-bold" style="color: var(--primary);">${this.formatNumber(totalAmount)} đ</td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm" onclick="app.previewTransaction('${t.id}')" title="Xem & In phiếu">
              <i data-feather="printer"></i>
            </button>
            <button class="btn btn-success btn-sm" onclick="app.exportTransactionExcel('${t.id}')" title="Xuất Excel Mẫu 26">
              <i data-feather="file-text"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="app.openEditReceipt('${t.id}')" title="Sửa phiếu">
              <i data-feather="edit-2"></i>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="app.deleteTransaction('${t.id}')" title="Xóa">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    this.initFeather();
  }

  openReceiptModal(trx = null) {
    const settings = this.db.getSettings();
    document.getElementById("form-receipt").reset();

    const tbody = document.getElementById("tbody-receipt-items");
    tbody.innerHTML = "";

    if (trx) {
      document.getElementById("modal-receipt-title").textContent = "Chỉnh Sửa Phiếu Nhập Kho (Mẫu 26)";
      document.getElementById("receipt-id").value = trx.id;
      document.getElementById("receipt-code").value = trx.code;
      document.getElementById("receipt-bookNo").value = trx.bookNo || "01/2026";
      document.getElementById("receipt-date").value = trx.date;
      document.getElementById("receipt-validUntil").value = trx.validUntil || "";
      document.getElementById("receipt-partnerName").value = trx.partnerName || "";
      document.getElementById("receipt-partnerAddress").value = trx.partnerAddress || "";
      document.getElementById("receipt-contractNo").value = trx.contractNo || "";
      document.getElementById("receipt-transportBy").value = trx.transportBy || "";
      document.getElementById("receipt-notes").value = trx.notes || "";
      document.getElementById("receipt-signerCreator").value = trx.signerCreator || settings.officerInCharge;
      document.getElementById("receipt-signerDeliverer").value = trx.signerDeliverer || "";
      document.getElementById("receipt-signerReceiver").value = trx.signerReceiver || settings.storekeeper;
      document.getElementById("receipt-signerApprover").value = trx.signerApprover || settings.chiefLogistics;

      if (trx.items && trx.items.length > 0) {
        trx.items.forEach(it => this.addReceiptRow(it));
      } else {
        this.addReceiptRow();
      }
    } else {
      document.getElementById("modal-receipt-title").textContent = "Lập Phiếu Nhập Kho (Mẫu 26: PNX-KH/QN17)";
      document.getElementById("receipt-id").value = "";
      document.getElementById("receipt-code").value = this.db.generateTransactionCode("IN");
      document.getElementById("receipt-bookNo").value = "01/2026";
      document.getElementById("receipt-date").value = new Date().toISOString().split("T")[0];
      document.getElementById("receipt-validUntil").value = "";
      document.getElementById("receipt-partnerName").value = "";
      document.getElementById("receipt-partnerAddress").value = "";
      document.getElementById("receipt-contractNo").value = "";
      document.getElementById("receipt-transportBy").value = "";
      document.getElementById("receipt-notes").value = "";
      document.getElementById("receipt-signerCreator").value = settings.officerInCharge;
      document.getElementById("receipt-signerDeliverer").value = "";
      document.getElementById("receipt-signerReceiver").value = settings.storekeeper;
      document.getElementById("receipt-signerApprover").value = settings.chiefLogistics;

      this.addReceiptRow();
    }

    this.calculateReceiptTotals();
    this.openModal("modal-receipt");
    this.initFeather();
  }

  addReceiptRow(item = null) {
    const products = this.db.getProducts();
    const tbody = document.getElementById("tbody-receipt-items");
    const rowIdx = tbody.children.length;

    const row = document.createElement("tr");

    let prodOptions = `<option value="">-- Chọn mặt hàng --</option>`;
    products.forEach(p => {
      const selected = (item && (item.productId === p.id || item.productCode === p.code)) ? "selected" : "";
      prodOptions += `<option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}" data-code="${p.code}" ${selected}>${p.name} (${p.code})</option>`;
    });

    row.innerHTML = `
      <td class="text-center">${rowIdx + 1}</td>
      <td>
        <select class="form-select row-product" required onchange="app.onReceiptProductChange(this)">
          ${prodOptions}
        </select>
      </td>
      <td class="text-center row-unit">${item?.unit || "Cái"}</td>
      <td>
        <select class="form-select row-quality" style="padding: 4px 6px;">
          <option value="Cap1" ${item?.quality === 'Cap1' ? 'selected' : ''}>Cấp 1</option>
          <option value="Cap2" ${item?.quality === 'Cap2' ? 'selected' : ''}>Cấp 2</option>
          <option value="Cap3" ${item?.quality === 'Cap3' ? 'selected' : ''}>Cấp 3</option>
          <option value="Cap4" ${item?.quality === 'Cap4' ? 'selected' : ''}>Cấp 4</option>
        </select>
      </td>
      <td><input type="number" class="form-control row-qty-req" min="0" value="${item?.qtyRequired || 1}" oninput="app.calculateReceiptTotals()"></td>
      <td><input type="number" class="form-control row-qty-act font-bold" min="0" value="${item?.qtyActual || 1}" oninput="app.calculateReceiptTotals()"></td>
      <td><input type="number" class="form-control row-price" min="0" value="${item?.price || 0}" oninput="app.calculateReceiptTotals()"></td>
      <td class="text-right font-bold row-amount" style="color: var(--primary);">${this.formatNumber(item?.amount || (item?.qtyActual * item?.price) || 0)} đ</td>
      <td><input type="text" class="form-control row-notes" value="${item?.notes || ''}" placeholder="Ghi chú"></td>
      <td class="text-center">
        <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); padding: 4px;" onclick="this.closest('tr').remove(); app.calculateReceiptTotals();">&times;</button>
      </td>
    `;

    tbody.appendChild(row);
  }

  onReceiptProductChange(selectEl) {
    const row = selectEl.closest("tr");
    const opt = selectEl.selectedOptions[0];
    if (opt && opt.value) {
      row.querySelector(".row-unit").textContent = opt.getAttribute("data-unit") || "Cái";
      row.querySelector(".row-price").value = opt.getAttribute("data-price") || 0;
      this.calculateReceiptTotals();
    }
  }

  calculateReceiptTotals() {
    const rows = document.querySelectorAll("#tbody-receipt-items tr");
    let totalQty = 0;
    let totalAmt = 0;

    rows.forEach((r, idx) => {
      r.children[0].textContent = idx + 1;
      const act = parseFloat(r.querySelector(".row-qty-act")?.value) || 0;
      const price = parseFloat(r.querySelector(".row-price")?.value) || 0;
      const amt = act * price;

      const amtCell = r.querySelector(".row-amount");
      if (amtCell) amtCell.textContent = this.formatNumber(amt) + " đ";

      totalQty += act;
      totalAmt += amt;
    });

    document.getElementById("receipt-total-qty").textContent = this.formatNumber(totalQty);
    document.getElementById("receipt-total-amount").textContent = this.formatNumber(totalAmt) + " đ";
  }

  saveReceipt() {
    const code = document.getElementById("receipt-code").value.trim();
    const date = document.getElementById("receipt-date").value;
    const partner = document.getElementById("receipt-partnerName").value.trim();

    if (!code || !date || !partner) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc: Số phiếu, Ngày lập, Đơn vị giao hàng!");
      return;
    }

    const rows = document.querySelectorAll("#tbody-receipt-items tr");
    if (rows.length === 0) {
      alert("Vui lòng thêm ít nhất một mặt hàng nhập kho!");
      return;
    }

    const items = [];
    let hasInvalid = false;

    rows.forEach(r => {
      const sel = r.querySelector(".row-product");
      const prodId = sel.value;
      if (!prodId) {
        hasInvalid = true;
        return;
      }
      const prod = this.db.getProductById(prodId);
      const opt = sel.selectedOptions[0];
      const act = parseFloat(r.querySelector(".row-qty-act").value) || 0;
      const req = parseFloat(r.querySelector(".row-qty-req").value) || act;
      const price = parseFloat(r.querySelector(".row-price").value) || 0;
      const quality = r.querySelector(".row-quality").value;
      const notes = r.querySelector(".row-notes").value;

      items.push({
        productId: prodId,
        productCode: prod ? prod.code : opt.getAttribute("data-code"),
        productName: prod ? prod.name : opt.text,
        unit: prod ? prod.unit : opt.getAttribute("data-unit"),
        quality: quality,
        qtyRequired: req,
        qtyActual: act,
        price: price,
        amount: act * price,
        notes: notes
      });
    });

    if (hasInvalid || items.length === 0) {
      alert("Vui lòng chọn mặt hàng hợp lệ cho tất cả các dòng hàng!");
      return;
    }

    const id = document.getElementById("receipt-id").value;
    const trx = {
      id: id || undefined,
      type: "IN",
      code: code,
      bookNo: document.getElementById("receipt-bookNo").value || "01/2026",
      date: date,
      validUntil: document.getElementById("receipt-validUntil").value,
      partnerName: partner,
      partnerAddress: document.getElementById("receipt-partnerAddress").value,
      contractNo: document.getElementById("receipt-contractNo").value,
      transportBy: document.getElementById("receipt-transportBy").value,
      receiverUnit: this.db.getSettings().subUnit,
      warehouseLocation: this.db.getSettings().warehouseName,
      signerCreator: document.getElementById("receipt-signerCreator").value,
      signerDeliverer: document.getElementById("receipt-signerDeliverer").value,
      signerReceiver: document.getElementById("receipt-signerReceiver").value,
      signerApprover: document.getElementById("receipt-signerApprover").value,
      notes: document.getElementById("receipt-notes").value,
      items: items
    };

    this.db.saveTransaction(trx);
    this.closeModal("modal-receipt");
    this.renderAll();
    this.showToast("Đã lưu Phiếu Nhập Kho thành công!", "success");
  }

  openEditReceipt(id) {
    const trx = this.db.getTransactionById(id);
    if (trx) {
      this.openReceiptModal(trx);
    }
  }

  // =========================================================================
  // XUẤT KHO (MẪU 26 / BIỂU SS14-QN10)
  // =========================================================================

  renderIssues() {
    const list = this.db.getTransactions().filter(t => t.type === "OUT");
    const tbody = document.querySelector("#tbl-issues tbody");

    const search = document.getElementById("search-issues")?.value.toLowerCase().trim() || "";
    const fromDate = document.getElementById("issue-filter-from")?.value;
    const toDate = document.getElementById("issue-filter-to")?.value;

    const filtered = list.filter(t => {
      const matchSearch = !search || t.code?.toLowerCase().includes(search) || t.receiverName?.toLowerCase().includes(search) || t.receiverUnit?.toLowerCase().includes(search);
      const matchFrom = !fromDate || new Date(t.date) >= new Date(fromDate);
      const matchTo = !toDate || new Date(t.date) <= new Date(toDate);
      return matchSearch && matchFrom && matchTo;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 24px; color: #888;">Không tìm thấy phiếu xuất kho nào phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((t, idx) => {
      const totalAmount = t.items?.reduce((s, it) => s + (it.amount || it.qtyActual * it.price || 0), 0) || 0;
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${t.code}</b></td>
          <td>${t.bookNo || "01/2026"}</td>
          <td>${this.formatDate(t.date)}</td>
          <td><b>${t.receiverName || "Cán bộ nhận"}</b> - ${t.receiverUnit || ""}</td>
          <td>${t.reason || t.notes || "Cấp phát"}</td>
          <td class="text-center"><span class="badge" style="background: #e2e8f0; color: #1e293b;">${t.items?.length || 0} mặt hàng</span></td>
          <td class="text-right font-bold" style="color: var(--danger);">${this.formatNumber(totalAmount)} đ</td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm" onclick="app.previewTransaction('${t.id}')" title="Xem & In phiếu">
              <i data-feather="printer"></i>
            </button>
            <button class="btn btn-success btn-sm" onclick="app.exportTransactionExcel('${t.id}')" title="Xuất Excel Mẫu 26">
              <i data-feather="file-text"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="app.openEditIssue('${t.id}')" title="Sửa phiếu">
              <i data-feather="edit-2"></i>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="app.deleteTransaction('${t.id}')" title="Xóa">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    this.initFeather();
  }

  openIssueModal(trx = null) {
    const settings = this.db.getSettings();
    document.getElementById("form-issue").reset();

    const tbody = document.getElementById("tbody-issue-items");
    tbody.innerHTML = "";

    if (trx) {
      document.getElementById("modal-issue-title").textContent = "Chỉnh Sửa Phiếu Xuất Kho (Mẫu 26 / Biểu SS14)";
      document.getElementById("issue-id").value = trx.id;
      document.getElementById("issue-code").value = trx.code;
      document.getElementById("issue-bookNo").value = trx.bookNo || "01/2026";
      document.getElementById("issue-date").value = trx.date;
      document.getElementById("issue-validUntil").value = trx.validUntil || "";
      document.getElementById("issue-receiverName").value = trx.receiverName || "";
      document.getElementById("issue-receiverUnit").value = trx.receiverUnit || "";
      document.getElementById("issue-contractNo").value = trx.contractNo || "";
      document.getElementById("issue-reason").value = trx.reason || trx.notes || "";
      document.getElementById("issue-signerCreator").value = trx.signerCreator || settings.officerInCharge;
      document.getElementById("issue-signerReceiver").value = trx.signerReceiver || trx.receiverName;
      document.getElementById("issue-signerStorekeeper").value = trx.signerStorekeeper || settings.storekeeper;
      document.getElementById("issue-signerChief").value = trx.signerChief || settings.chiefLogistics;
      document.getElementById("issue-signerApprover").value = trx.signerApprover || settings.commander;

      if (trx.items && trx.items.length > 0) {
        trx.items.forEach(it => this.addIssueRow(it));
      } else {
        this.addIssueRow();
      }
    } else {
      document.getElementById("modal-issue-title").textContent = "Lập Phiếu Xuất Kho (Biểu SS14-QN10 / Mẫu 26)";
      document.getElementById("issue-id").value = "";
      document.getElementById("issue-code").value = this.db.generateTransactionCode("OUT");
      document.getElementById("issue-bookNo").value = "01/2026";
      document.getElementById("issue-date").value = new Date().toISOString().split("T")[0];
      document.getElementById("issue-validUntil").value = "";
      document.getElementById("issue-receiverName").value = "";
      document.getElementById("issue-receiverUnit").value = "";
      document.getElementById("issue-contractNo").value = "";
      document.getElementById("issue-reason").value = "Cấp phát trang bị theo kế hoạch";
      document.getElementById("issue-signerCreator").value = settings.officerInCharge;
      document.getElementById("issue-signerReceiver").value = "";
      document.getElementById("issue-signerStorekeeper").value = settings.storekeeper;
      document.getElementById("issue-signerChief").value = settings.chiefLogistics;
      document.getElementById("issue-signerApprover").value = settings.commander;

      this.addIssueRow();
    }

    this.calculateIssueTotals();
    this.openModal("modal-issue");
    this.initFeather();
  }

  addIssueRow(item = null) {
    const products = this.db.getProducts();
    const stockList = this.db.calculateCurrentStock();
    const stockMap = {};
    stockList.forEach(s => stockMap[s.product.id] = s.totalQty);

    const tbody = document.getElementById("tbody-issue-items");
    const rowIdx = tbody.children.length;

    const row = document.createElement("tr");

    let prodOptions = `<option value="">-- Chọn mặt hàng xuất --</option>`;
    products.forEach(p => {
      const curStock = stockMap[p.id] || 0;
      const selected = (item && (item.productId === p.id || item.productCode === p.code)) ? "selected" : "";
      prodOptions += `<option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}" data-stock="${curStock}" ${selected}>${p.name} (Tồn: ${curStock} ${p.unit})</option>`;
    });

    const initStock = item?.productId ? (stockMap[item.productId] || 0) : 0;

    row.innerHTML = `
      <td class="text-center">${rowIdx + 1}</td>
      <td>
        <select class="form-select row-issue-product" required onchange="app.onIssueProductChange(this)">
          ${prodOptions}
        </select>
      </td>
      <td class="text-center row-issue-unit">${item?.unit || "Cái"}</td>
      <td>
        <select class="form-select row-issue-quality" style="padding: 4px 6px;">
          <option value="Cap1" ${item?.quality === 'Cap1' ? 'selected' : ''}>Cấp 1</option>
          <option value="Cap2" ${item?.quality === 'Cap2' ? 'selected' : ''}>Cấp 2</option>
          <option value="Cap3" ${item?.quality === 'Cap3' ? 'selected' : ''}>Cấp 3</option>
          <option value="Cap4" ${item?.quality === 'Cap4' ? 'selected' : ''}>Cấp 4</option>
        </select>
      </td>
      <td class="text-right font-bold row-issue-stock" style="color: #0d47a1;">${this.formatNumber(initStock)}</td>
      <td><input type="number" class="form-control row-issue-qty-req" min="0" value="${item?.qtyRequired || 1}" oninput="app.calculateIssueTotals()"></td>
      <td><input type="number" class="form-control row-issue-qty-act font-bold" min="0" value="${item?.qtyActual || 1}" oninput="app.calculateIssueTotals()"></td>
      <td><input type="number" class="form-control row-issue-price" min="0" value="${item?.price || 0}" oninput="app.calculateIssueTotals()"></td>
      <td class="text-right font-bold row-issue-amount" style="color: var(--danger);">${this.formatNumber(item?.amount || (item?.qtyActual * item?.price) || 0)} đ</td>
      <td><input type="text" class="form-control row-issue-notes" value="${item?.notes || ''}" placeholder="Ghi chú"></td>
      <td class="text-center">
        <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); padding: 4px;" onclick="this.closest('tr').remove(); app.calculateIssueTotals();">&times;</button>
      </td>
    `;

    tbody.appendChild(row);
  }

  onIssueProductChange(selectEl) {
    const row = selectEl.closest("tr");
    const opt = selectEl.selectedOptions[0];
    if (opt && opt.value) {
      row.querySelector(".row-issue-unit").textContent = opt.getAttribute("data-unit") || "Cái";
      row.querySelector(".row-issue-price").value = opt.getAttribute("data-price") || 0;
      row.querySelector(".row-issue-stock").textContent = this.formatNumber(parseFloat(opt.getAttribute("data-stock")) || 0);
      this.calculateIssueTotals();
    }
  }

  calculateIssueTotals() {
    const rows = document.querySelectorAll("#tbody-issue-items tr");
    let totalQty = 0;
    let totalAmt = 0;

    rows.forEach((r, idx) => {
      r.children[0].textContent = idx + 1;
      const act = parseFloat(r.querySelector(".row-issue-qty-act")?.value) || 0;
      const price = parseFloat(r.querySelector(".row-issue-price")?.value) || 0;
      const amt = act * price;

      const amtCell = r.querySelector(".row-issue-amount");
      if (amtCell) amtCell.textContent = this.formatNumber(amt) + " đ";

      totalQty += act;
      totalAmt += amt;
    });

    document.getElementById("issue-total-qty").textContent = this.formatNumber(totalQty);
    document.getElementById("issue-total-amount").textContent = this.formatNumber(totalAmt) + " đ";
  }

  saveIssue() {
    const code = document.getElementById("issue-code").value.trim();
    const date = document.getElementById("issue-date").value;
    const receiverName = document.getElementById("issue-receiverName").value.trim();
    const receiverUnit = document.getElementById("issue-receiverUnit").value.trim();

    if (!code || !date || !receiverName || !receiverUnit) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc: Số phiếu, Ngày lập, Người nhận và Đơn vị nhận!");
      return;
    }

    const rows = document.querySelectorAll("#tbody-issue-items tr");
    if (rows.length === 0) {
      alert("Vui lòng thêm ít nhất một mặt hàng xuất kho!");
      return;
    }

    const items = [];
    let hasInvalid = false;
    let overdraftWarning = false;

    rows.forEach(r => {
      const sel = r.querySelector(".row-issue-product");
      const prodId = sel.value;
      if (!prodId) {
        hasInvalid = true;
        return;
      }
      const prod = this.db.getProductById(prodId);
      const opt = sel.selectedOptions[0];
      const act = parseFloat(r.querySelector(".row-issue-qty-act").value) || 0;
      const req = parseFloat(r.querySelector(".row-issue-qty-req").value) || act;
      const price = parseFloat(r.querySelector(".row-issue-price").value) || 0;
      const quality = r.querySelector(".row-issue-quality").value;
      const notes = r.querySelector(".row-issue-notes").value;

      const stockAvail = parseFloat(opt.getAttribute("data-stock")) || 0;
      if (act > stockAvail) {
        overdraftWarning = true;
      }

      items.push({
        productId: prodId,
        productCode: prod ? prod.code : opt.getAttribute("data-code"),
        productName: prod ? prod.name : opt.text,
        unit: prod ? prod.unit : opt.getAttribute("data-unit"),
        quality: quality,
        qtyRequired: req,
        qtyActual: act,
        price: price,
        amount: act * price,
        notes: notes
      });
    });

    if (hasInvalid || items.length === 0) {
      alert("Vui lòng chọn mặt hàng hợp lệ cho tất cả các dòng hàng!");
      return;
    }

    if (overdraftWarning) {
      const confirmOver = confirm("CẢNH BÁO: Có mặt hàng có số lượng thực xuất vượt quá tồn kho hiện tại! Bạn có chắc chắn muốn xuất không?");
      if (!confirmOver) return;
    }

    const id = document.getElementById("issue-id").value;
    const trx = {
      id: id || undefined,
      type: "OUT",
      code: code,
      bookNo: document.getElementById("issue-bookNo").value || "01/2026",
      date: date,
      validUntil: document.getElementById("issue-validUntil").value,
      receiverName: receiverName,
      receiverUnit: receiverUnit,
      partnerName: receiverUnit,
      contractNo: document.getElementById("issue-contractNo").value,
      reason: document.getElementById("issue-reason").value,
      notes: document.getElementById("issue-reason").value,
      warehouseLocation: this.db.getSettings().warehouseName,
      signerCreator: document.getElementById("issue-signerCreator").value,
      signerReceiver: document.getElementById("issue-signerReceiver").value,
      signerStorekeeper: document.getElementById("issue-signerStorekeeper").value,
      signerChief: document.getElementById("issue-signerChief").value,
      signerApprover: document.getElementById("issue-signerApprover").value,
      items: items
    };

    this.db.saveTransaction(trx);
    this.closeModal("modal-issue");
    this.renderAll();
    this.showToast("Đã lưu Phiếu Xuất Kho thành công!", "success");
  }

  openEditIssue(id) {
    const trx = this.db.getTransactionById(id);
    if (trx) {
      this.openIssueModal(trx);
    }
  }

  deleteTransaction(id) {
    if (confirm("Bạn có chắc chắn muốn xóa phiếu này không? Tồn kho sẽ được tự động tính toán lại.")) {
      this.db.deleteTransaction(id);
      this.renderAll();
      this.showToast("Đã xóa phiếu thành công!", "info");
    }
  }

  // =========================================================================
  // SỔ THEO DÕI VẬT CHẤT (MẪU 09)
  // =========================================================================

  renderLedgerFilter() {
    const select = document.getElementById("ledger-select-product");
    const products = this.db.getProducts();

    let opts = `<option value="ALL">-- Tất cả mặt hàng trong kho --</option>`;
    products.forEach(p => {
      opts += `<option value="${p.id}">${p.name} (Mã: ${p.code})</option>`;
    });
    select.innerHTML = opts;
  }

  renderLedger() {
    const prodId = document.getElementById("ledger-select-product")?.value || "ALL";
    const fromDate = document.getElementById("ledger-filter-from")?.value;
    const toDate = document.getElementById("ledger-filter-to")?.value;

    const ledgerData = this.db.getLedgerData(prodId, fromDate, toDate);
    const container = document.getElementById("ledger-view-container");

    if (ledgerData.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: #888;">Chưa có dữ liệu theo dõi cho mặt hàng này.</div>`;
      return;
    }

    let html = "";
    ledgerData.forEach((item, idx) => {
      const p = item.product;

      let rows = `
        <tr style="background: #f8fafc; font-weight: bold;">
          <td colspan="3" class="text-center">SỐ DƯ ĐẦU KỲ</td>
          <td></td>
          <td></td>
          <td></td>
          <td class="text-right" style="color: #0d47a1;">${this.formatNumber(item.openingStock)}</td>
          <td>Chuyển sang</td>
        </tr>
      `;

      if (item.entries.length === 0) {
        rows += `<tr><td colspan="8" class="text-center" style="padding: 16px; color: #888; font-style: italic;">Không có phát sinh giao dịch nhập/xuất trong khoảng thời gian này</td></tr>`;
      } else {
        item.entries.forEach(e => {
          rows += `
            <tr>
              <td class="text-center"><b>${e.docNo}</b></td>
              <td class="text-center">${this.formatDate(e.date)}</td>
              <td>${e.partner}</td>
              <td class="text-center"><span class="badge-cap ${e.quality?.toLowerCase() || 'cap-1'}">${this.exporter.getQualityLabel(e.quality)}</span></td>
              <td class="text-right font-bold" style="color: #16a34a;">${e.inQty ? this.formatNumber(e.inQty) : "-"}</td>
              <td class="text-right font-bold" style="color: #dc2626;">${e.outQty ? this.formatNumber(e.outQty) : "-"}</td>
              <td class="text-right font-bold">${this.formatNumber(e.balance)}</td>
              <td>${e.notes || ""}</td>
            </tr>
          `;
        });
      }

      rows += `
        <tr style="background: #f1f5f9; font-weight: bold;">
          <td colspan="3" class="text-center">TỔNG PHÁT SINH TRONG KỲ</td>
          <td></td>
          <td class="text-right" style="color: #16a34a;">${this.formatNumber(item.periodIn)}</td>
          <td class="text-right" style="color: #dc2626;">${this.formatNumber(item.periodOut)}</td>
          <td></td>
          <td></td>
        </tr>
        <tr style="background: #e2e8f0; font-weight: bold;">
          <td colspan="3" class="text-center">SỐ DƯ TỒN CUỐI KỲ</td>
          <td></td>
          <td></td>
          <td></td>
          <td class="text-right" style="color: var(--primary); font-size: 15px;">${this.formatNumber(item.closingStock)}</td>
          <td>Giá trị: ${this.formatNumber(item.closingStock * (p.price || 0))} đ</td>
        </tr>
      `;

      html += `
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header" style="background: #fdfdfd;">
            <div>
              <span class="badge" style="background: var(--primary); color: #fff; margin-right: 8px;">Trang ${idx + 1}</span>
              <span style="font-size: 16px; font-weight: bold; color: var(--dark); text-transform: uppercase;">${p.name}</span>
              <span style="color: #64748b; margin-left: 8px;">(Mã: ${p.code})</span>
            </div>
            <div style="font-size: 13px;">
              <b>ĐVT:</b> ${p.unit} &nbsp;|&nbsp; <b>Đơn giá:</b> ${this.formatNumber(p.price)} đ &nbsp;|&nbsp; 
              <b>Tồn hiện tại:</b> <span class="badge" style="background: #dcfce7; color: #16a34a; font-weight: bold; font-size: 13px;">${this.formatNumber(item.closingStock)} ${p.unit}</span>
            </div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="table-custom">
                <thead>
                  <tr>
                    <th colspan="2" style="width: 170px;" class="text-center">Lệnh / Chứng từ</th>
                    <th rowspan="2">Đơn vị giao nhận / Diễn giải</th>
                    <th rowspan="2" style="width: 80px;" class="text-center">Phẩm cấp</th>
                    <th rowspan="2" style="width: 100px;" class="text-right">Nhập</th>
                    <th rowspan="2" style="width: 100px;" class="text-right">Xuất</th>
                    <th rowspan="2" style="width: 110px;" class="text-right">Tồn kho</th>
                    <th rowspan="2" style="width: 150px;">Ghi chú</th>
                  </tr>
                  <tr>
                    <th style="width: 90px;" class="text-center">Số</th>
                    <th style="width: 80px;" class="text-center">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // =========================================================================
  // BÁO CÁO KIỂM KÊ (MẪU 1.6)
  // =========================================================================

  renderInventoryPeriods() {
    const list = this.db.getInventories();
    const select = document.getElementById("select-inventory-period");

    let opts = "";
    list.forEach(inv => {
      opts += `<option value="${inv.id}">${inv.title} (${this.formatDate(inv.date)})</option>`;
    });

    select.innerHTML = opts || `<option value="">-- Chưa có đợt kiểm kê nào --</option>`;
    this.renderInventoryView();
  }

  renderInventoryView() {
    const invId = document.getElementById("select-inventory-period")?.value;
    const container = document.getElementById("inventory-view-container");

    if (!invId) {
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: #888;">Chưa có kỳ kiểm kê nào được chọn. Hãy tạo kỳ kiểm kê mới.</div>`;
      return;
    }

    const inv = this.db.getInventoryById(invId);
    if (!inv) return;

    // Hiển thị giao diện xem trước & sửa số liệu kiểm kê trực tiếp
    const records = inv.records || [];
    const txRecords = records.filter(r => r.type === "TXuyen" || !r.type);
    const dtRecords = records.filter(r => r.type === "DTSSCD");

    function buildTableHTML(list, title, typeKey) {
      let trs = "";
      let totalAmount = 0;
      let totalQty = 0;

      list.forEach((r, idx) => {
        const amt = r.amount || (r.actualQty * (r.price || 0));
        totalAmount += amt;
        totalQty += r.actualQty;

        trs += `
          <tr data-record-id="${r.productId}">
            <td class="text-center">${idx + 1}</td>
            <td style="font-family: monospace;">${r.productCode}</td>
            <td><b>${r.productName}</b></td>
            <td class="text-center">${r.unit}</td>
            <td class="text-right">${new Intl.NumberFormat("vi-VN").format(r.price)}</td>
            <td class="text-right">${r.qtyPrevious || 0}</td>
            <td class="text-right" style="color: #16a34a;">${r.increaseTotal || 0}</td>
            <td class="text-right" style="color: #dc2626;">${r.decreaseTotal || 0}</td>
            <td class="text-right font-bold">${r.bookQty || 0}</td>
            <td class="text-right">
              <input type="number" class="form-control inv-actual-qty font-bold" min="0" value="${r.actualQty}" style="width: 70px; text-align: right;" onchange="app.onInventoryRecordChange('${inv.id}', '${r.productId}', this)">
            </td>
            <td class="text-right font-bold inv-amount" style="color: var(--primary);">${new Intl.NumberFormat("vi-VN").format(amt)}</td>
            <td class="text-right inv-diff-over" style="color: green;">${r.diffOver || 0}</td>
            <td class="text-right inv-diff-under" style="color: red;">${r.diffUnder || 0}</td>
            <td><input type="number" class="form-control inv-q1" min="0" value="${r.quality1 || 0}" style="width: 55px; text-align: right;" onchange="app.onInventoryQualityChange('${inv.id}', '${r.productId}', this)"></td>
            <td><input type="number" class="form-control inv-q2" min="0" value="${r.quality2 || 0}" style="width: 55px; text-align: right;" onchange="app.onInventoryQualityChange('${inv.id}', '${r.productId}', this)"></td>
            <td><input type="number" class="form-control inv-q3" min="0" value="${r.quality3 || 0}" style="width: 55px; text-align: right;" onchange="app.onInventoryQualityChange('${inv.id}', '${r.productId}', this)"></td>
            <td><input type="number" class="form-control inv-q4" min="0" value="${r.quality4 || 0}" style="width: 55px; text-align: right;" onchange="app.onInventoryQualityChange('${inv.id}', '${r.productId}', this)"></td>
            <td><input type="text" class="form-control inv-action" value="${r.actionPlan || r.notes || ''}" style="width: 140px;" onchange="app.onInventoryActionChange('${inv.id}', '${r.productId}', this)"></td>
          </tr>
        `;
      });

      return `
        <div style="margin-bottom: 24px;">
          <div style="font-weight: bold; font-size: 15px; color: var(--primary); text-transform: uppercase; margin-bottom: 8px;">
            ${title} (${list.length} mặt hàng)
          </div>
          <div class="table-responsive">
            <table class="table-custom" style="font-size: 12px;">
              <thead>
                <tr>
                  <th rowspan="3" style="width: 30px;" class="text-center">TT</th>
                  <th rowspan="3" style="width: 110px;">Mã số</th>
                  <th rowspan="3">Tên mặt hàng vật tư</th>
                  <th rowspan="3" style="width: 50px;" class="text-center">ĐVT</th>
                  <th rowspan="3" style="width: 80px;" class="text-right">Đơn giá</th>
                  <th rowspan="3" style="width: 60px;" class="text-right">Kỳ trước</th>
                  <th colspan="2" class="text-center">Tăng / Giảm</th>
                  <th colspan="3" class="text-center">Kỳ kiểm kê này</th>
                  <th colspan="2" class="text-center">Chênh lệch</th>
                  <th colspan="4" class="text-center">Phân cấp chất lượng</th>
                  <th rowspan="3" style="width: 140px;">Phương án xử lý</th>
                </tr>
                <tr>
                  <th rowspan="2" style="width: 55px;" class="text-right">Tăng</th>
                  <th rowspan="2" style="width: 55px;" class="text-right">Giảm</th>
                  <th rowspan="2" style="width: 60px;" class="text-right">Sổ sách</th>
                  <th colspan="2" class="text-center">Thực tế</th>
                  <th rowspan="2" style="width: 45px;" class="text-right">Thừa</th>
                  <th rowspan="2" style="width: 45px;" class="text-right">Thiếu</th>
                  <th rowspan="2" style="width: 55px;" class="text-center">Cấp 1</th>
                  <th rowspan="2" style="width: 55px;" class="text-center">Cấp 2</th>
                  <th rowspan="2" style="width: 55px;" class="text-center">Cấp 3</th>
                  <th rowspan="2" style="width: 55px;" class="text-center">Cấp 4</th>
                </tr>
                <tr>
                  <th style="width: 75px;" class="text-center">Số lượng</th>
                  <th style="width: 110px;" class="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${trs}
                <tr style="font-weight: bold; background: #f8fafc;">
                  <td colspan="5" class="text-center">TỔNG CỘNG</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="text-right font-bold">${new Intl.NumberFormat("vi-VN").format(totalQty)}</td>
                  <td class="text-right font-bold" style="color: var(--primary);">${new Intl.NumberFormat("vi-VN").format(totalAmount)} đ</td>
                  <td colspan="7"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="background: #fdfdfd; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 18px; font-weight: bold; color: var(--dark);">${inv.title}</div>
            <div style="color: #64748b; font-size: 13px;">Thời điểm: 0h ngày ${this.formatDate(inv.date)} &nbsp;|&nbsp; Hội đồng: ${inv.committeeHead}</div>
          </div>
          <div>
            <button class="btn btn-danger btn-sm" onclick="app.deleteInventory('${inv.id}')">
              <i data-feather="trash-2"></i> Xóa đợt kiểm kê
            </button>
          </div>
        </div>
      </div>

      ${buildTableHTML(txRecords, "Phụ lục 2: Vật chất, trang bị Quân nhu thường xuyên", "TXuyen")}
      ${buildTableHTML(dtRecords, "Phụ lục 1: Vật chất, trang bị Quân nhu Dự trữ SSCĐ", "DTSSCD")}
    `;

    this.initFeather();
  }

  onInventoryRecordChange(invId, prodId, inputEl) {
    const inv = this.db.getInventoryById(invId);
    if (!inv) return;
    const rec = inv.records.find(r => r.productId === prodId);
    if (!rec) return;

    const actual = parseFloat(inputEl.value) || 0;
    rec.actualQty = actual;
    rec.amount = actual * (rec.price || 0);

    const book = rec.bookQty || 0;
    if (actual > book) {
      rec.diffOver = actual - book;
      rec.diffUnder = 0;
    } else if (actual < book) {
      rec.diffUnder = book - actual;
      rec.diffOver = 0;
    } else {
      rec.diffOver = 0;
      rec.diffUnder = 0;
    }

    this.db.saveInventory(inv);
    this.renderInventoryView();
    this.showToast("Đã cập nhật số lượng kiểm kê!", "info");
  }

  onInventoryQualityChange(invId, prodId, inputEl) {
    const inv = this.db.getInventoryById(invId);
    if (!inv) return;
    const rec = inv.records.find(r => r.productId === prodId);
    if (!rec) return;

    const row = inputEl.closest("tr");
    rec.quality1 = parseFloat(row.querySelector(".inv-q1").value) || 0;
    rec.quality2 = parseFloat(row.querySelector(".inv-q2").value) || 0;
    rec.quality3 = parseFloat(row.querySelector(".inv-q3").value) || 0;
    rec.quality4 = parseFloat(row.querySelector(".inv-q4").value) || 0;

    this.db.saveInventory(inv);
  }

  onInventoryActionChange(invId, prodId, inputEl) {
    const inv = this.db.getInventoryById(invId);
    if (!inv) return;
    const rec = inv.records.find(r => r.productId === prodId);
    if (!rec) return;
    rec.actionPlan = inputEl.value;
    this.db.saveInventory(inv);
  }

  deleteInventory(id) {
    if (confirm("Bạn có chắc chắn muốn xóa đợt kiểm kê này không?")) {
      this.db.deleteInventory(id);
      this.renderInventoryPeriods();
      this.showToast("Đã xóa đợt kiểm kê!", "info");
    }
  }

  // =========================================================================
  // DANH MỤC MẶT HÀNG
  // =========================================================================

  renderProducts() {
    const products = this.db.getProducts();
    const stockList = this.db.calculateCurrentStock();
    const stockMap = {};
    stockList.forEach(s => stockMap[s.product.id] = s);

    const tbody = document.querySelector("#tbl-products tbody");

    const search = document.getElementById("search-products")?.value.toLowerCase().trim() || "";
    const cat = document.getElementById("filter-category")?.value || "ALL";
    const type = document.getElementById("filter-stock-type")?.value || "ALL";

    const filtered = products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search);
      const matchCat = (cat === "ALL") || p.categoryId === cat;
      const matchType = (type === "ALL") || (p.type || "TXuyen") === type;
      return matchSearch && matchCat && matchType;
    });

    const catNameMap = {
      CAT_QT: "Quân trang",
      CAT_CD: "Dụng cụ cấp dưỡng",
      CAT_QL: "Quân lương - LTTP",
      CAT_DC: "Doanh cụ & Khác"
    };

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 24px; color: #888;">Không tìm thấy mặt hàng nào phù hợp</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((p, idx) => {
      const s = stockMap[p.id];
      const stockQty = s ? s.totalQty : 0;
      const totalVal = stockQty * (p.price || 0);

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td style="font-family: monospace;"><b>${p.code}</b></td>
          <td>
            <b>${p.name}</b>
            ${p.specs ? `<br><small style="color: #64748b;">${p.specs}</small>` : ""}
          </td>
          <td>${catNameMap[p.categoryId] || p.categoryId}</td>
          <td class="text-center">${p.unit}</td>
          <td class="text-right font-bold">${this.formatNumber(p.price)} đ</td>
          <td class="text-center">
            <span class="badge" style="background: ${p.type === 'DTSSCD' ? '#fef3c7; color: #b45309;' : '#e0f2fe; color: #0284c7;'}">
              ${p.type === 'DTSSCD' ? 'Dự trữ SSCĐ' : 'Thường xuyên'}
            </span>
          </td>
          <td class="text-right font-bold" style="color: ${stockQty <= (p.minStock || 10) ? '#dc2626' : '#1b5e20'};">
            ${this.formatNumber(stockQty)} ${p.unit}
          </td>
          <td class="text-right font-bold">${this.formatNumber(totalVal)} đ</td>
          <td class="text-center">
            <button class="btn btn-outline btn-sm" onclick="app.openEditProduct('${p.id}')" title="Sửa mặt hàng">
              <i data-feather="edit-2"></i>
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="app.deleteProduct('${p.id}')" title="Xóa">
              <i data-feather="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    this.initFeather();
  }

  openProductModal(prod = null) {
    document.getElementById("form-product").reset();
    if (prod) {
      document.getElementById("modal-product-title").textContent = "Chỉnh Sửa Mặt Hàng";
      document.getElementById("prod-id").value = prod.id;
      document.getElementById("prod-code").value = prod.code;
      document.getElementById("prod-name").value = prod.name;
      document.getElementById("prod-category").value = prod.categoryId || "CAT_QT";
      document.getElementById("prod-unit").value = prod.unit;
      document.getElementById("prod-price").value = prod.price || 0;
      document.getElementById("prod-type").value = prod.type || "TXuyen";
      document.getElementById("prod-minStock").value = prod.minStock || 10;
      document.getElementById("prod-specs").value = prod.specs || "";
      document.getElementById("prod-notes").value = prod.notes || "";
    } else {
      document.getElementById("modal-product-title").textContent = "Thêm Mặt Hàng Mới";
      document.getElementById("prod-id").value = "";
      document.getElementById("prod-code").value = "";
      document.getElementById("prod-name").value = "";
      document.getElementById("prod-category").value = "CAT_QT";
      document.getElementById("prod-unit").value = "Cái";
      document.getElementById("prod-price").value = 0;
      document.getElementById("prod-type").value = "TXuyen";
      document.getElementById("prod-minStock").value = 10;
      document.getElementById("prod-specs").value = "";
      document.getElementById("prod-notes").value = "";
    }

    this.openModal("modal-product");
  }

  saveProduct() {
    const code = document.getElementById("prod-code").value.trim();
    const name = document.getElementById("prod-name").value.trim();
    const unit = document.getElementById("prod-unit").value.trim();
    const price = parseFloat(document.getElementById("prod-price").value) || 0;

    if (!code || !name || !unit) {
      alert("Vui lòng nhập đầy đủ: Mã số, Tên mặt hàng và Đơn vị tính!");
      return;
    }

    const id = document.getElementById("prod-id").value;
    const prod = {
      id: id || undefined,
      code: code,
      name: name,
      categoryId: document.getElementById("prod-category").value,
      unit: unit,
      price: price,
      type: document.getElementById("prod-type").value,
      minStock: parseFloat(document.getElementById("prod-minStock").value) || 10,
      specs: document.getElementById("prod-specs").value,
      notes: document.getElementById("prod-notes").value
    };

    this.db.saveProduct(prod);
    this.closeModal("modal-product");
    this.renderAll();
    this.showToast("Đã lưu mặt hàng thành công!", "success");
  }

  openEditProduct(id) {
    const p = this.db.getProductById(id);
    if (p) this.openProductModal(p);
  }

  deleteProduct(id) {
    if (confirm("Bạn có chắc chắn muốn xóa mặt hàng này khỏi danh mục?")) {
      this.db.deleteProduct(id);
      this.renderAll();
      this.showToast("Đã xóa mặt hàng!", "info");
    }
  }

  // =========================================================================
  // XUẤT BIỂU MẪU & IN ẤN (EXPORT & PRINT)
  // =========================================================================

  previewTransaction(id) {
    const trx = this.db.getTransactionById(id);
    if (!trx) return;

    let html = "";
    let filename = "";

    if (trx.type === "IN") {
      html = this.exporter.getReceiptHTML(trx);
      filename = `Phieu_Nhap_${trx.code}_Mau26.xls`;
      document.getElementById("modal-print-title").textContent = `Xem Trước Phiếu Nhập Kho: ${trx.code} (Mẫu 26)`;
    } else {
      html = this.exporter.getIssueHTML(trx);
      filename = `Phieu_Xuat_${trx.code}_Mau26.xls`;
      document.getElementById("modal-print-title").textContent = `Xem Trước Phiếu Xuất Kho: ${trx.code} (Mẫu 26)`;
    }

    this.currentPreviewHTML = html;
    this.currentPreviewFilename = filename;

    document.getElementById("print-preview-content").innerHTML = html;
    this.openModal("modal-print-preview");
  }

  exportTransactionExcel(id) {
    const trx = this.db.getTransactionById(id);
    if (!trx) return;

    if (trx.type === "IN") {
      const html = this.exporter.getReceiptHTML(trx);
      this.exporter.exportToExcelHTML(html, `Phieu_Nhap_${trx.code}_Mau26.xls`);
    } else {
      const html = this.exporter.getIssueHTML(trx);
      this.exporter.exportToExcelHTML(html, `Phieu_Xuat_${trx.code}_Mau26.xls`);
    }
    this.showToast("Đang tải file Excel biểu mẫu về máy...", "success");
  }

  openExportModal(type) {
    const transactions = this.db.getTransactions();
    const target = transactions.find(t => t.type === (type === "RECEIPT" ? "IN" : "OUT"));
    if (target) {
      this.previewTransaction(target.id);
    } else {
      alert("Chưa có phiếu nào để xem trước. Hãy tạo phiếu trước!");
    }
  }

  quickExportReceiptExcel() {
    const target = this.db.getTransactions().find(t => t.type === "IN");
    if (target) {
      this.exportTransactionExcel(target.id);
    } else {
      alert("Chưa có phiếu nhập nào để xuất!");
    }
  }

  quickExportIssueExcel() {
    const target = this.db.getTransactions().find(t => t.type === "OUT");
    if (target) {
      this.exportTransactionExcel(target.id);
    } else {
      alert("Chưa có phiếu xuất nào để xuất!");
    }
  }

  // =========================================================================
  // SETTINGS & BACKUP
  // =========================================================================

  loadSettings() {
    const s = this.db.getSettings();
    document.getElementById("topbar-unit-tag").textContent = `Đơn vị: ${s.unitName || "Trường CĐTS"}`;

    document.getElementById("cfg-unitName").value = s.unitName || "";
    document.getElementById("cfg-subUnit").value = s.subUnit || "";
    document.getElementById("cfg-department").value = s.department || "";
    document.getElementById("cfg-warehouseName").value = s.warehouseName || "";
    document.getElementById("cfg-warehouseAddress").value = s.warehouseAddress || "";
    document.getElementById("cfg-storekeeper").value = s.storekeeper || "";
    document.getElementById("cfg-officerInCharge").value = s.officerInCharge || "";
    document.getElementById("cfg-chiefLogistics").value = s.chiefLogistics || "";
    document.getElementById("cfg-commander").value = s.commander || "";
  }

  saveSettingsForm(e) {
    e.preventDefault();
    const s = {
      unitName: document.getElementById("cfg-unitName").value.trim(),
      subUnit: document.getElementById("cfg-subUnit").value.trim(),
      department: document.getElementById("cfg-department").value.trim(),
      warehouseName: document.getElementById("cfg-warehouseName").value.trim(),
      warehouseAddress: document.getElementById("cfg-warehouseAddress").value.trim(),
      storekeeper: document.getElementById("cfg-storekeeper").value.trim(),
      officerInCharge: document.getElementById("cfg-officerInCharge").value.trim(),
      chiefLogistics: document.getElementById("cfg-chiefLogistics").value.trim(),
      commander: document.getElementById("cfg-commander").value.trim(),
      currency: "VNĐ"
    };

    this.db.saveSettings(s);
    this.loadSettings();
    this.showToast("Đã lưu thông tin đơn vị và cấu hình biểu mẫu!", "success");
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  bindEvents() {
    // Menu navigation
    document.querySelectorAll(".menu-item").forEach(item => {
      item.addEventListener("click", e => {
        const tabId = item.getAttribute("data-tab");
        if (tabId) this.switchTab(tabId);
      });
    });

    // Quick topbar buttons
    document.getElementById("btn-quick-new-receipt")?.addEventListener("click", () => this.openReceiptModal());
    document.getElementById("btn-quick-new-issue")?.addEventListener("click", () => this.openIssueModal());
    document.getElementById("btn-create-receipt")?.addEventListener("click", () => this.openReceiptModal());
    document.getElementById("btn-create-issue")?.addEventListener("click", () => this.openIssueModal());
    document.getElementById("btn-add-product")?.addEventListener("click", () => this.openProductModal());

    // Receipt modal buttons
    document.getElementById("btn-receipt-add-row")?.addEventListener("click", () => this.addReceiptRow());
    document.getElementById("btn-save-receipt")?.addEventListener("click", () => this.saveReceipt());

    // Issue modal buttons
    document.getElementById("btn-issue-add-row")?.addEventListener("click", () => this.addIssueRow());
    document.getElementById("btn-save-issue")?.addEventListener("click", () => this.saveIssue());

    // Product modal buttons
    document.getElementById("btn-save-product")?.addEventListener("click", () => this.saveProduct());

    // Search & Filter receipts/issues
    document.getElementById("search-receipts")?.addEventListener("input", () => this.renderReceipts());
    document.getElementById("receipt-filter-from")?.addEventListener("change", () => this.renderReceipts());
    document.getElementById("receipt-filter-to")?.addEventListener("change", () => this.renderReceipts());
    document.getElementById("btn-receipt-reset-filter")?.addEventListener("click", () => {
      document.getElementById("search-receipts").value = "";
      document.getElementById("receipt-filter-from").value = "";
      document.getElementById("receipt-filter-to").value = "";
      this.renderReceipts();
    });

    document.getElementById("search-issues")?.addEventListener("input", () => this.renderIssues());
    document.getElementById("issue-filter-from")?.addEventListener("change", () => this.renderIssues());
    document.getElementById("issue-filter-to")?.addEventListener("change", () => this.renderIssues());
    document.getElementById("btn-issue-reset-filter")?.addEventListener("click", () => {
      document.getElementById("search-issues").value = "";
      document.getElementById("issue-filter-from").value = "";
      document.getElementById("issue-filter-to").value = "";
      this.renderIssues();
    });

    // Product search
    document.getElementById("search-products")?.addEventListener("input", () => this.renderProducts());
    document.getElementById("filter-category")?.addEventListener("change", () => this.renderProducts());
    document.getElementById("filter-stock-type")?.addEventListener("change", () => this.renderProducts());

    // Ledger triggers
    document.getElementById("btn-ledger-filter")?.addEventListener("click", () => this.renderLedger());
    document.getElementById("btn-print-ledger")?.addEventListener("click", () => {
      const prodId = document.getElementById("ledger-select-product")?.value || "ALL";
      const fromDate = document.getElementById("ledger-filter-from")?.value;
      const toDate = document.getElementById("ledger-filter-to")?.value;
      const data = this.db.getLedgerData(prodId, fromDate, toDate);
      const html = this.exporter.getLedgerHTML(data, fromDate, toDate);
      this.exporter.printDirect(html);
    });
    document.getElementById("btn-export-excel-ledger")?.addEventListener("click", () => {
      const prodId = document.getElementById("ledger-select-product")?.value || "ALL";
      const fromDate = document.getElementById("ledger-filter-from")?.value;
      const toDate = document.getElementById("ledger-filter-to")?.value;
      const data = this.db.getLedgerData(prodId, fromDate, toDate);
      const html = this.exporter.getLedgerHTML(data, fromDate, toDate);
      this.exporter.exportToExcelHTML(html, "So_Theo_Doi_Vat_Chat_Mau09.xls");
      this.showToast("Đang tải file Excel Sổ theo dõi Mẫu 09...", "success");
    });

    // Inventory triggers
    document.getElementById("select-inventory-period")?.addEventListener("change", () => this.renderInventoryView());
    document.getElementById("btn-create-inventory-period")?.addEventListener("click", () => {
      document.getElementById("new-inv-date").value = new Date().toISOString().split("T")[0];
      this.openModal("modal-new-inventory");
    });
    document.getElementById("btn-submit-new-inventory")?.addEventListener("click", () => {
      const title = document.getElementById("new-inv-title").value.trim();
      const date = document.getElementById("new-inv-date").value;
      const prevDate = document.getElementById("new-inv-prev-date").value;
      if (!title || !date) {
        alert("Vui lòng nhập đầy đủ tiêu đề và ngày kiểm kê!");
        return;
      }
      this.db.createInventoryDraft(title, date, prevDate);
      this.closeModal("modal-new-inventory");
      this.renderInventoryPeriods();
      this.showToast("Đã khởi tạo đợt kiểm kê thành công!", "success");
    });

    document.getElementById("btn-print-inventory")?.addEventListener("click", () => {
      const invId = document.getElementById("select-inventory-period")?.value;
      const inv = this.db.getInventoryById(invId);
      if (!inv) return;
      const html = this.exporter.getInventoryHTML(inv);
      this.exporter.printDirect(html);
    });
    document.getElementById("btn-export-excel-inventory")?.addEventListener("click", () => {
      const invId = document.getElementById("select-inventory-period")?.value;
      const inv = this.db.getInventoryById(invId);
      if (!inv) return;
      const html = this.exporter.getInventoryHTML(inv);
      this.exporter.exportToExcelHTML(html, `Bao_Cao_Kiem_Ke_${inv.code}_Mau1_6.xls`);
      this.showToast("Đang tải file Excel Báo cáo kiểm kê Mẫu 1.6...", "success");
    });
    document.getElementById("btn-export-word-inventory")?.addEventListener("click", () => {
      const invId = document.getElementById("select-inventory-period")?.value;
      const inv = this.db.getInventoryById(invId);
      if (!inv) return;
      const html = this.exporter.getInventoryHTML(inv);
      this.exporter.exportToWordDoc(html, `Bao_Cao_Kiem_Ke_${inv.code}_Mau1_6.doc`);
      this.showToast("Đang tải file Word Báo cáo kiểm kê (.doc)...", "success");
    });

    // Print Modal Actions
    document.getElementById("btn-print-modal-direct")?.addEventListener("click", () => {
      this.exporter.printDirect(this.currentPreviewHTML);
    });
    document.getElementById("btn-print-modal-excel")?.addEventListener("click", () => {
      this.exporter.exportToExcelHTML(this.currentPreviewHTML, this.currentPreviewFilename || "BieuMau.xls");
      this.showToast("Đang xuất file Excel...", "success");
    });

    // Settings form
    document.getElementById("form-settings")?.addEventListener("submit", e => this.saveSettingsForm(e));

    // Backup & Restore
    document.getElementById("btn-quick-backup")?.addEventListener("click", () => {
      const json = this.db.exportAllDataJSON();
      this.exporter.downloadFile(json, `Backup_Kho_${new Date().toISOString().split("T")[0]}.json`, "application/json");
      this.showToast("Đã tải tệp sao lưu JSON về máy!", "success");
    });
    document.getElementById("btn-export-backup-json")?.addEventListener("click", () => {
      const json = this.db.exportAllDataJSON();
      this.exporter.downloadFile(json, `Backup_Kho_${new Date().toISOString().split("T")[0]}.json`, "application/json");
      this.showToast("Đã tải tệp sao lưu JSON về máy!", "success");
    });

    document.getElementById("btn-restore-json")?.addEventListener("click", () => {
      const fileInput = document.getElementById("file-restore-json");
      if (!fileInput.files || fileInput.files.length === 0) {
        alert("Vui lòng chọn tệp .json sao lưu để phục hồi!");
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        const res = this.db.importDataJSON(ev.target.result);
        if (res.success) {
          this.loadSettings();
          this.renderAll();
          this.showToast("Phục hồi dữ liệu thành công!", "success");
        } else {
          alert("Lỗi khi đọc file sao lưu: " + res.error);
        }
      };
      reader.readAsText(fileInput.files[0]);
    });

    document.getElementById("btn-reset-defaults")?.addEventListener("click", () => {
      if (confirm("CẢNH BÁO: Thao tác này sẽ đặt lại toàn bộ dữ liệu về mẫu biểu gốc (Mẫu 26, Mẫu 09, Mẫu 1.6). Bạn có chắc chắn không?")) {
        this.db.resetToDefaults();
        this.loadSettings();
        this.renderAll();
        this.showToast("Đã khôi phục toàn bộ dữ liệu mẫu gốc!", "success");
      }
    });
  }

  // Modal helpers
  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
    this.initFeather();
  }

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WarehouseApp();
});
