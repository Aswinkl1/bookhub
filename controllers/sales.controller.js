const Order = require("../models/order.schema")
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const PDFDocument = require("pdfkit")
const ExcelJS = require("exceljs");





const salesReportRender = async (req,res)=>{
    try {
        res.render('sales-report')
    } catch (error) {
        console.log(error)
        
    }
}


const getSalesReport = async (req, res) => {

    try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { filterBy, fromDate, toDate } = req.query;
    console.log(filterBy,fromDate,toDate)
    console.log(typeof fromDate)
    // let filter = { status: { $in: ['Delivered','Return Rejected'] } };
    let filter = {}
    

    if (fromDate && toDate) {
        console.log("here")
    filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
    };
    } else {
    const today = new Date();
    if (filterBy === "daily") {
        filter.createdAt = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(),
        };
    } else if (filterBy === "weekly") {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        filter.createdAt = {
        $gte: lastWeek,
        $lte: new Date(),
        };
    } else if (filterBy === "monthly") {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        filter.createdAt = {
        $gte: lastMonth,
        $lte: new Date(),
        };
    } else if (filterBy === "yearly") {
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        filter.createdAt = {
        $gte: lastYear,
        $lte: new Date(),
        };
    }
    }


    const totalOrders = await Order.countDocuments(filter);
    const totals = await Order.aggregate([
    { $match: filter },
    {
        $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalDiscount: { $sum: "$discountAmount" },
        
        },
    },
    ]);
    // console.log(totals)
    const totalRevenue = totals.length > 0 ? totals[0].totalRevenue : 0;
    const totalDiscount = totals.length > 0 ? totals[0].totalDiscount : 0;
    // const totalProductDiscount = totals.length > 0 ? totals[0].totalProductDiscount : 0;
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(filter)
    .populate("userId", "name email phone")
    .populate("items.productId", "productName salePrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    console.log(orders)
    res.status(200).json({orders,totalDiscount,totalRevenue,totalOrders})
    // res.render("salesReport", {
    // orders,
    // totalRevenue,
    // totalDiscount,
    // totalProductDiscount,
    // totalOrders,
    // currentPage: page,
    // totalPages,
    // filterBy,
    // fromDate,
    // toDate,
    // });
    } catch (error) {
    console.log("Error getting sales report", error);
    res.status(500).json({ success: false, message: "Internal server error" });
    }
  };





const getSalesReportPDF = async (req, res) => {
    try {
      const { filterBy, fromDate, toDate } = req.query;
  
      let filter = {};
      const today = new Date();
  
      if (fromDate && toDate) {
        filter.createdAt = {
          $gte: new Date(fromDate),
          $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
        };
      } else {
        if (filterBy === "daily") {
          filter.createdAt = {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lte: new Date(),
          };
        } else if (filterBy === "weekly") {
          const lastWeek = new Date();
          lastWeek.setDate(today.getDate() - 7);
          filter.createdAt = { $gte: lastWeek, $lte: new Date() };
        } else if (filterBy === "monthly") {
          const lastMonth = new Date();
          lastMonth.setMonth(today.getMonth() - 1);
          filter.createdAt = { $gte: lastMonth, $lte: new Date() };
        } else if (filterBy === "yearly") {
          const lastYear = new Date();
          lastYear.setFullYear(today.getFullYear() - 1);
          filter.createdAt = { $gte: lastYear, $lte: new Date() };
        }
      }
  
      const orders = await Order.find(filter)
        .populate("userId", "name")
        .sort({ createdAt: -1 });
  
      const totals = await Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalDiscount: { $sum: "$discountAmount" },
          },
        },
      ]);
  
      const totalRevenue = totals[0]?.totalRevenue || 0;
      const totalDiscount = totals[0]?.totalDiscount || 0;
      const totalOrders = orders.length;
  
      // Create directory if not exists
      const salesReportDir = path.join(__dirname, "../../public/salesReport");
      if (!fs.existsSync(salesReportDir)) {
        fs.mkdirSync(salesReportDir, { recursive: true });
      }
  
      const filePath = path.join(salesReportDir, "sales_report.pdf");
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
  
      // Header
      doc.fontSize(20).text("Sales Report", { align: "center" });
      doc
        .fontSize(10)
        .text(`Generated: ${moment().format("DD/MM/YYYY HH:mm")}`, {
          align: "center",
        })
        .moveDown(1);
  
      // Summary
      doc.fontSize(12).text(`Total Orders: ${totalOrders}`);
      doc.text(`Total Revenue: ${totalRevenue.toLocaleString()}`);
      doc.text(`Total Discount: ${totalDiscount.toLocaleString()}`).moveDown(1);
  
      // Table Header
      doc.font("Helvetica-Bold").fontSize(11);
      
      const headerY = doc.y;
      doc.text("Order ID", 50, headerY);
      doc.text("Customer", 200, headerY);
      doc.text("Amount", 350, headerY);
      doc.text("Date", 450, headerY);
      doc.moveTo(50, headerY + 15).lineTo(550, headerY + 15).stroke();
      doc.moveDown();
  
      // Rows
      doc.font("Helvetica").fontSize(10);
      orders.forEach((order) => {
        const y = doc.y;
        doc.text(order._id.toString(), 50, y, { width: 140 });
        doc.text(order.userId?.name || "-", 200, y, { width: 120 });
        doc.text(`${order.totalPrice.toLocaleString()}`, 350, y, { width: 80 });
        doc.text(moment(order.createdAt).format("DD/MM/YYYY"), 450, y, { width: 100 });
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        doc.moveDown();
      });
  
      doc.end();
  
      stream.on("finish", () => {
        res.download(filePath, "sales_report.pdf", (err) => {
          if (err) {
            console.error("PDF Download Error:", err);
            res.status(500).send("Download error");
          }
          fs.unlinkSync(filePath); // Clean up
        });
      });
    } catch (error) {
      console.error("Sales Report PDF Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };


  const getSalesReportExcel = async (req, res) => {
    try {
      const { filterBy, fromDate, toDate } = req.query;
  
      let filter = {};
  
      const today = new Date();
      if (fromDate && toDate) {
        filter.createdAt = {
          $gte: new Date(fromDate),
          $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
        };
      } else {
        if (filterBy === "daily") {
          filter.createdAt = {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lte: new Date(),
          };
        } else if (filterBy === "weekly") {
          const lastWeek = new Date();
          lastWeek.setDate(today.getDate() - 7);
          filter.createdAt = { $gte: lastWeek, $lte: new Date() };
        } else if (filterBy === "monthly") {
          const lastMonth = new Date();
          lastMonth.setMonth(today.getMonth() - 1);
          filter.createdAt = { $gte: lastMonth, $lte: new Date() };
        } else if (filterBy === "yearly") {
          const lastYear = new Date();
          lastYear.setFullYear(today.getFullYear() - 1);
          filter.createdAt = { $gte: lastYear, $lte: new Date() };
        }
      }
  
      const orders = await Order.find(filter)
        .populate("userId", "name")
        .sort({ createdAt: -1 });
  
      const totals = await Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalDiscount: { $sum: "$discountAmount" },
          },
        },
      ]);
  
      const totalRevenue = totals[0]?.totalRevenue || 0;
      const totalDiscount = totals[0]?.totalDiscount || 0;
      const totalOrders = orders.length;
  
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");
  
      // Header
      worksheet.mergeCells("A1", "D1");
      worksheet.getCell("A1").value = "Sales Report";
      worksheet.getCell("A1").alignment = { horizontal: "center" };
      worksheet.getCell("A1").font = { size: 16, bold: true };
  
      worksheet.mergeCells("A2", "D2");
      worksheet.getCell("A2").value = `Generated: ${moment().format("DD/MM/YYYY HH:mm")}`;
      worksheet.getCell("A2").alignment = { horizontal: "center" };
  
      worksheet.addRow([]);
  
      // Summary
      worksheet.addRow(["Total Orders", totalOrders]);
      worksheet.addRow(["Total Revenue", `₹${totalRevenue.toLocaleString()}`]);
      worksheet.addRow(["Total Discount", `₹${totalDiscount.toLocaleString()}`]);
      worksheet.addRow([]);
  
      // Table header
      worksheet.addRow(["Order ID", "Customer", "Amount", "Date"]);
      const headerRow = worksheet.getRow(7);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: "center" };
  
      // Table data
      orders.forEach((order) => {
        worksheet.addRow([
          order._id.toString(),
          order.userId?.name || "-",
          `₹${order.totalPrice.toLocaleString()}`,
          moment(order.createdAt).format("DD/MM/YYYY"),
        ]);
      });
  
      // Adjust column width
      worksheet.columns.forEach((col) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 10;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        col.width = maxLength + 5;
      });
  
      // Save file to disk
      const excelPath = path.join(__dirname, "../../public/salesReport");
      if (!fs.existsSync(excelPath)) fs.mkdirSync(excelPath, { recursive: true });
  
      const filePath = path.join(excelPath, "sales_report.xlsx");
  
      await workbook.xlsx.writeFile(filePath);
  
      res.download(filePath, "sales_report.xlsx", (err) => {
        if (err) {
          console.error("Excel Download Error:", err);
          res.status(500).send("Download error");
        }
        fs.unlinkSync(filePath); // Clean up
      });
    } catch (error) {
      console.error("Sales Report Excel Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    salesReportRender,
    getSalesReport,
    getSalesReportPDF,
    getSalesReportExcel,


}