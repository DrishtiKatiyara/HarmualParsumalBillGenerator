let base64Logo = null;

// Convert image to Base64
function toDataURL(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    const reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.send();
}

// Load logo on page load
window.onload = function () {
  toDataURL("logo.png", function (base64) {
    base64Logo = base64;
  });
};

// Add new item row
function addItem() {
  const div = document.createElement("div");
  div.classList.add("item-row");
  div.innerHTML = `
    <input type="text" placeholder="Item" class="item">
    <input type="number" placeholder="Quantity" class="qty">
    <input type="text" placeholder="Unit (e.g. pc/box/container)" class="unit">
    <input type="number" placeholder="Rate" class="rate">
    <button onclick="deleteItem(this)" class="delete-btn">Delete</button>
  `;
  document.getElementById("items").appendChild(div);
}

// Delete item row
function deleteItem(button) {
  const row = button.parentElement;
  row.remove();
}

// Generate PDF
function generatePDF() {
  const billNo = document.getElementById("billNo").value;
  const date = document.getElementById("date").value;

  const buyerGST = document.getElementById("buyerGST").value;
  const buyerName = document.getElementById("buyerName").value;
  const buyerPhone = document.getElementById("buyerPhone").value;
  const buyerAddress = document.getElementById("buyerAddress").value;

  const handlingCharges = parseFloat(document.getElementById("handlingCharges").value) || 0;
  const shippingCharges = parseFloat(document.getElementById("shippingCharges").value) || 0;

  const items = document.querySelectorAll(".item-row");
  let body = [
    [
      { text: "Sr. No", bold: true, alignment: "center" },
      { text: "Particulars", bold: true, alignment: "center" },
      { text: "Qty & Unit", bold: true, alignment: "center" },
      { text: "Rate", bold: true, alignment: "center" },
      { text: "Amount (Rs.)", bold: true, alignment: "center" }
    ]
  ];

  let total = 0;

  items.forEach((row, index) => {
    const item = row.querySelector(".item").value;
    const qty = parseInt(row.querySelector(".qty").value) || 0;
    const unit = row.querySelector(".unit").value || "";
    const rate = parseFloat(row.querySelector(".rate").value) || 0;
    const amount = qty * rate;
    total += amount;

    if (item) {
      body.push([
        { text: index + 1, alignment: "center" },
        { text: item, margin: [5, 3] },
        { text: `${qty} ${unit}`, alignment: "center" },
        { text: rate.toFixed(2), alignment: "right", margin: [5, 3] },
        { text: amount.toFixed(2), alignment: "right", margin: [5, 3] }
      ]);
    }
  });

  if (handlingCharges > 0) {
    body.push([
      { text: "Handling Charges", colSpan: 4, alignment: "right", margin: [0, 5, 5, 5] }, {}, {}, {},
      { text: handlingCharges.toFixed(2), alignment: "right", margin: [0, 5, 5, 5] }
    ]);
    total += handlingCharges;
  }

  if (shippingCharges > 0) {
    body.push([
      { text: "Shipping Charges", colSpan: 4, alignment: "right", margin: [0, 5, 5, 5] }, {}, {}, {},
      { text: shippingCharges.toFixed(2), alignment: "right", margin: [0, 5, 5, 5] }
    ]);
    total += shippingCharges;
  }

  body.push([
    { text: "Grand Total", colSpan: 4, alignment: "right", bold: true, margin: [0, 5, 5, 5] }, {}, {}, {},
    { text: total.toFixed(2), bold: true, alignment: "right", margin: [0, 5, 5, 5] }
  ]);

  // --- PDF Structure ---
  const docDefinition = {
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        stack: [
          base64Logo
            ? { image: base64Logo, width: 400, alignment: "center", margin: [0, 0, 0, 10] }
            : {},
          { text: "FSSAI No: 11515009000054    GST No: 27AXPBK1016E1Z3", fontSize: 10, alignment: "center", margin: [0, 2, 0, 10] }
        ]
      },
      {
        columns: [
          { text: `Bill No: ${billNo}`, alignment: 'left', bold: true },
          { text: `Date: ${date}`, alignment: 'right', bold: true }
        ],
        margin: [0, 0, 0, 10]
      },
      {
        text: [
          { text: "Bill To:\n", bold: true },
          { text: `GST No: ${buyerGST}\n`, italics: true },
          { text: `${buyerName}, ${buyerPhone}\n${buyerAddress}\n` }
        ],
        margin: [0, 0, 0, 10],
        fontSize: 11
      },
      {
        table: {
          headerRows: 1,
          widths: [40, "*", 80, 60, 80],
          body: body
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => "#999",
          vLineColor: () => "#999",
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 4,
          paddingBottom: () => 4
        },
        margin: [0, 0, 0, 10]
      },
      {
        text: "Please pay 50% advance for order confirmation.",
        italics: true,
        margin: [0, 0, 0, 10]
      },
      { text: "Terms and Conditions:", bold: true, margin: [5, 10, 5, 4] },
      {
        ul: [
          { text: "Payment at the time of delivery.", fontSize: 10, margin: [0, 0, 0, 6] },
          { text: "No Return, No Exchange.", fontSize: 10, margin: [0, 0, 0, 6] },
          { text: "Products may lose weight due to moisture / climate.", fontSize: 10, margin: [0, 0, 0, 6] },
          { text: "We are under composite scheme of GST.", fontSize: 10, margin: [0, 0, 0, 6] },
          { text: "This is a system generated bill hence doesn't require any stamp or signature.", fontSize: 10 }
        ]
      }
    ],
    styles: {
      header: { bold: true, fontSize: 16, margin: [0, 5, 0, 5] }
    },
    defaultStyle: {
      fontSize: 12
    }
  };

  // --- Dynamically adjust logo width to 80% of page width ---
  const pageWidth = pdfMake.pageSize ? pdfMake.pageSize.width : 595.28; // Default A4 width
  const usableWidth = pageWidth - (docDefinition.pageMargins[0] + docDefinition.pageMargins[2]);
  const logoWidth = 0.8 * usableWidth;

  if (docDefinition.content[0].stack && docDefinition.content[0].stack[0].image) {
    docDefinition.content[0].stack[0].width = logoWidth;
  }

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`${buyerName}Bill_${billNo}.pdf`);
}
