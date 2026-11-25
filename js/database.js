/**
 * MODULE DATABASE & DATA PROCESSING
 * Quản lý lưu trữ IndexedDB / LocalStorage, tính toán tồn kho, phẩm cấp chất lượng
 */

const DB_KEYS = {
  SETTINGS: "wh_settings",
  CATEGORIES: "wh_categories",
  PRODUCTS: "wh_products",
  TRANSACTIONS: "wh_transactions",
  INVENTORIES: "wh_inventories"
};

class WarehouseDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      this.resetToDefaults();
    }
  }

  resetToDefaults() {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem(DB_KEYS.INVENTORIES, JSON.stringify(DEFAULT_INVENTORIES));
  }

  // --- SETTINGS ---
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings) {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- CATEGORIES ---
  getCategories() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.CATEGORIES)) || [];
    } catch {
      return [];
    }
  }

  // --- PRODUCTS ---
  getProducts() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS)) || [];
    } catch {
      return [];
    }
  }

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  saveProduct(product) {
    const products = this.getProducts();
    if (!product.id) {
      product.id = "P_" + Date.now();
      products.push(product);
    } else {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        products[idx] = product;
      } else {
        products.push(product);
      }
    }
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    return product;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  }

  // --- TRANSACTIONS (NHẬP / XUẤT) ---
  getTransactions() {
    try {
      const list = JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS)) || [];
      // Sắp xếp ngày mới nhất lên đầu
      return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
      return [];
    }
  }

  getTransactionById(id) {
    const list = this.getTransactions();
    return list.find(t => t.id === id) || null;
  }

  saveTransaction(trx) {
    const list = this.getTransactions();
    if (!trx.id) {
      trx.id = "TRX_" + Date.now();
      list.unshift(trx);
    } else {
      const idx = list.findIndex(t => t.id === trx.id);
      if (idx !== -1) {
        list[idx] = trx;
      } else {
        list.unshift(trx);
      }
    }
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(list));
    return trx;
  }

  deleteTransaction(id) {
    let list = this.getTransactions();
    list = list.filter(t => t.id !== id);
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(list));
  }

  // Sinh mã phiếu tự động
  generateTransactionCode(type) {
    const prefix = type === "IN" ? "PN" : "PX";
    const d = new Date();
    const yyyymm = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, "0");
    const list = this.getTransactions().filter(t => t.type === type && t.code && t.code.includes(yyyymm));
    const nextSeq = list.length + 1;
    return `${prefix}-${yyyymm}-${String(nextSeq).padStart(3, "0")}`;
  }

  // --- TÍNH TOÁN TỒN KHO & PHẨM CẤP ---
  calculateCurrentStock(targetDate = null) {
    const products = this.getProducts();
    const transactions = this.getTransactions();

    const stockMap = {};

    products.forEach(p => {
      stockMap[p.id] = {
        product: p,
        totalQty: 0,
        totalValue: 0,
        totalIn: 0,
        totalOut: 0,
        byQuality: {
          Cap1: 0,
          Cap2: 0,
          Cap3: 0,
          Cap4: 0
        }
      };
    });

    const compareTime = targetDate ? new Date(targetDate).setHours(23, 59, 59, 999) : Infinity;

    // Sắp xếp tăng dần theo thời gian để cộng trừ tồn kho
    const sortedTrx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTrx.forEach(trx => {
      const trxTime = new Date(trx.date).getTime();
      if (trxTime > compareTime) return;

      if (!trx.items || !Array.isArray(trx.items)) return;

      trx.items.forEach(item => {
        if (!stockMap[item.productId]) {
          stockMap[item.productId] = {
            product: {
              id: item.productId,
              code: item.productCode || "N/A",
              name: item.productName || "Hàng hóa",
              unit: item.unit || "Cái",
              price: item.price || 0,
              type: "TXuyen"
            },
            totalQty: 0,
            totalValue: 0,
            totalIn: 0,
            totalOut: 0,
            byQuality: { Cap1: 0, Cap2: 0, Cap3: 0, Cap4: 0 }
          };
        }

        const s = stockMap[item.productId];
        const qty = parseFloat(item.qtyActual) || 0;
        const qualityKey = item.quality || "Cap1";

        if (trx.type === "IN") {
          s.totalIn += qty;
          s.totalQty += qty;
          s.byQuality[qualityKey] = (s.byQuality[qualityKey] || 0) + qty;
        } else if (trx.type === "OUT") {
          s.totalOut += qty;
          s.totalQty -= qty;
          s.byQuality[qualityKey] = Math.max(0, (s.byQuality[qualityKey] || 0) - qty);
        }

        s.totalValue = s.totalQty * (s.product.price || 0);
      });
    });

    return Object.values(stockMap);
  }

  // --- SỔ THEO DÕI VẬT CHẤT (MẪU 09) ---
  getLedgerData(productId = "ALL", fromDate = null, toDate = null) {
    const products = this.getProducts();
    const transactions = this.getTransactions();

    const fromTime = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : -Infinity;
    const toTime = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

    // Lọc theo mặt hàng nếu có
    const targetProducts = (productId === "ALL")
      ? products
      : products.filter(p => p.id === productId);

    const ledgerResults = [];

    targetProducts.forEach(prod => {
      let openingStock = 0;
      let runningStock = 0;
      const entries = [];
      let periodIn = 0;
      let periodOut = 0;

      // Sắp xếp các giao dịch theo thời gian tăng dần
      const sortedTrx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

      sortedTrx.forEach(trx => {
        const trxTime = new Date(trx.date).getTime();
        const item = trx.items?.find(it => it.productId === prod.id);
        if (!item) return;

        const qty = parseFloat(item.qtyActual) || 0;

        if (trxTime < fromTime) {
          // Tính vào tồn đầu kỳ
          if (trx.type === "IN") {
            openingStock += qty;
          } else {
            openingStock -= qty;
          }
        } else if (trxTime <= toTime) {
          // Giao dịch trong kỳ
          if (entries.length === 0) {
            runningStock = openingStock;
          }

          const inQty = trx.type === "IN" ? qty : 0;
          const outQty = trx.type === "OUT" ? qty : 0;

          if (trx.type === "IN") {
            runningStock += inQty;
            periodIn += inQty;
          } else {
            runningStock -= outQty;
            periodOut += outQty;
          }

          entries.push({
            date: trx.date,
            docNo: trx.code,
            partner: trx.type === "IN" ? (trx.partnerName || "Nhập kho") : (trx.receiverUnit || trx.receiverName || "Xuất kho"),
            quality: item.quality || "Cap1",
            inQty: inQty,
            outQty: outQty,
            balance: runningStock,
            price: item.price || prod.price,
            notes: trx.notes || item.notes || ""
          });
        }
      });

      const closingStock = (entries.length > 0) ? runningStock : openingStock;

      ledgerResults.push({
        product: prod,
        openingStock,
        periodIn,
        periodOut,
        closingStock,
        entries
      });
    });

    return ledgerResults;
  }

  // --- KIỂM KÊ (MẪU 1.6) ---
  getInventories() {
    try {
      const list = JSON.parse(localStorage.getItem(DB_KEYS.INVENTORIES)) || [];
      return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
      return [];
    }
  }

  getInventoryById(id) {
    const list = this.getInventories();
    return list.find(inv => inv.id === id) || null;
  }

  saveInventory(inv) {
    const list = this.getInventories();
    if (!inv.id) {
      inv.id = "INV_" + Date.now();
      list.unshift(inv);
    } else {
      const idx = list.findIndex(i => i.id === inv.id);
      if (idx !== -1) {
        list[idx] = inv;
      } else {
        list.unshift(inv);
      }
    }
    localStorage.setItem(DB_KEYS.INVENTORIES, JSON.stringify(list));
    return inv;
  }

  deleteInventory(id) {
    let list = this.getInventories();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(DB_KEYS.INVENTORIES, JSON.stringify(list));
  }

  // Tạo đợt kiểm kê tự động từ tồn kho hiện tại
  createInventoryDraft(title, date, previousDate = null) {
    const stockList = this.calculateCurrentStock(date);
    const records = stockList.map(s => {
      const p = s.product;
      const actual = s.totalQty;
      return {
        productId: p.id,
        productCode: p.code,
        productName: p.name,
        unit: p.unit,
        price: p.price,
        type: p.type || "TXuyen",
        qtyPrevious: s.totalQty,
        increaseTotal: 0,
        decreaseTotal: 0,
        bookQty: s.totalQty,
        actualQty: actual,
        diffOver: 0,
        diffUnder: 0,
        amount: actual * (p.price || 0),
        quality1: s.byQuality.Cap1 || actual,
        quality2: s.byQuality.Cap2 || 0,
        quality3: s.byQuality.Cap3 || 0,
        quality4: s.byQuality.Cap4 || 0,
        storageUse: p.type || "TXuyen",
        actionPlan: "Bảo quản trong kho theo quy định",
        notes: ""
      };
    });

    const settings = this.getSettings();

    const inv = {
      id: "INV_" + Date.now(),
      code: "KK-" + date.replace(/-/g, ""),
      title: title || `Báo cáo kiểm kê 0h ngày ${date}`,
      date: date,
      previousDate: previousDate || "",
      period: "Kỳ kiểm kê " + date,
      committeeHead: settings.chiefLogistics || "Chủ nhiệm Hậu cần",
      committeeMembers: `${settings.officerInCharge || "Trợ lý"}, ${settings.storekeeper || "Thủ kho"}`,
      conclusion: "Hàng hóa khớp sổ sách, tình trạng bảo quản tốt.",
      status: "COMPLETED",
      records: records
    };

    return this.saveInventory(inv);
  }

  // --- SAO LƯU & PHỤC HỒI (BACKUP & RESTORE) ---
  exportAllDataJSON() {
    const dump = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      settings: this.getSettings(),
      categories: this.getCategories(),
      products: this.getProducts(),
      transactions: this.getTransactions(),
      inventories: this.getInventories()
    };
    return JSON.stringify(dump, null, 2);
  }

  importDataJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.categories) localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(data.categories));
      if (data.products) localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(data.products));
      if (data.transactions) localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.inventories) localStorage.setItem(DB_KEYS.INVENTORIES, JSON.stringify(data.inventories));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// Khởi tạo global DB instance
window.warehouseDB = new WarehouseDB();
