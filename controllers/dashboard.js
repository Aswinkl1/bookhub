
const { months } = require("moment")
const category = require("../models/category.schema")
const Order = require("../models/order.schema")
const User = require("../models/user.schema")


const renderAdminDashboard = async (req,res) =>{
    try {
        const topProducts = await Order.aggregate([
            {
                $match: {
                  
                //   status: { $in: ['Delivered', 'Return-cancelled'] }
                }
            },
            { $unwind: "$items" }, // explode items array
            { $group: {
                _id: "$items.productId", // group by productId
                totalSold: { $sum: "$items.quantity" }, // sum quantity
                totalRevenue: { $sum: "$items.totalItemPrice" } // sum money
            }},
            { $sort: { totalSold: -1 } }, // sort by most sold
            { $limit: 10 },
            { $lookup: { // get product details
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }},
            { $unwind: "$product" },
            { $project: {
                _id:0,
                productName: "$product.productTitle",
                images:"$product.productImage",
                totalSold: 1,
                totalRevenue: 1
            }}
          ]);
        
          
          const topCategories = await Order.aggregate([
            { $unwind: "$items" },
            { 
              $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "productInfo"
              }
            },
            { $unwind: "$productInfo" },
            { 
              $group: {
                _id: "$productInfo.category", // group by categoryId (ObjectId)
                totalSold: { $sum: "$items.quantity" },
                totalRevenue: { $sum: "$items.totalItemPrice" }
              }
            },
            { 
              $lookup: { // lookup category name
                from: "categories",   // <-- your categories collection
                localField: "_id",
                foreignField: "_id",
                as: "categoryInfo"
              }
            },
            { $unwind: "$categoryInfo" },
            { 
              $project: {
                category: "$categoryInfo.name", // finally use category name
                totalSold: 1,
                totalRevenue: 1
              }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
          ]);
          
          console.log(topProducts)
        res.render("dashboard",{topCategories,topProducts})
    } catch (error) {
        console.log(error)
    }
}

function _chartFilter(filterData){
    let filter = {}
    if(filterData == "weekly"){
        filter.order = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
                  },
                }
            },
            {
            $group:{
                _id:{$dayOfWeek:'$createdAt'},
                totalOrders:{$sum:1}
            }
        },

        {
            $sort:{_id:1}
        }
    ]
        filter.sales = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
                  },
                  status: { $in: ['Delivered', 'Return-cancelled'] }
                }
            },
            {
                $group:{
                    _id:{$dayOfWeek:'$orderDate'},
                    totalrevenue:{$sum:"$totalPrice"}
                }
            },
            {
                $sort:{_id:1}
            }
        ]

        filter.user = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
                  },
                }
            },
            {
                $group:{
                    _id:{$dayOfWeek:'$createdAt'},
                    totalOrders:{$sum:1}
                }
        
            },
            {
                $sort:{_id:1}
            }
        ]

        filter.category = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Last 7 days
                  },
                  status: { $in: ['Delivered', 'Return-cancelled'] }
                }
            },
            {$unwind:"$items"},
            {$lookup:{
                from:"products",
                localField:"items.productId",
                foreignField:"_id",
                as:"productDetails"
            }},
            {
                $unwind:"$productDetails"

            },
            {
                $group:{
                    _id:"$productDetails.category",
                    totalQuantity:{$sum:"$items.quantity"}
                }
            },
            {
                $lookup:{
                    from:"categories",
                    localField:"_id",
                    foreignField:"_id",
                    as:"categoryInfo"
                }
            },
            {
                $unwind:"$categoryInfo"
            },
            {
                $project:{
                    _id:0,
                    categoryName:"$categoryInfo.name",
                    totalQuantity:1
                }
            },
            
        ]

    }else if(filterData == "yearly"){
        filter.order = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), 0, 1) // Jan 1st of current year
                  },
                }
              },
              {
            $group:{
                _id:{$year:'$orderDate'},
                totalOrders:{$sum:1}
            }
        },
        {
            $sort:{_id:1}
        }
    ]
        filter.sales = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), 0, 1) // Jan 1st of current year
                  },
                  status: { $in: ['Delivered', 'Return-cancelled'] }
                }
              },
            {
                $group:{
                    _id:{$year:'$createdAt'},
                    totalRevenue:{$sum:"$totalPrice"}
                }
            },
            {
                $sort:{_id:1}
            }
        ]

        filter.user = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), 0, 1) // Jan 1st of current year
                  },
                }
              },
            {
                $group:{
                    _id:{$year:'$createdAt'},
                    totalUsers:{$sum:1}
                }
        
            },
            {
                $sort:{_id:1}
            }
        ]

        filter.category = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), 0, 1) // Jan 1st of current year
                  },
                  status: { $in: ['Delivered', 'Return-cancelled'] }
                }
              },
              
            {$unwind:"$items"},
            {$lookup:{
                from:"products",
                localField:"items.productId",
                foreignField:"_id",
                as:"productDetails"
            }},
            {
                $unwind:"$productDetails"

            },
            {
                $group:{
                    _id:"$productDetails.category",
                    totalQuantity:{$sum:"$items.quantity"}
                }
            },
            {
                $lookup:{
                    from:"categories",
                    localField:"_id",
                    foreignField:"_id",
                    as:"categoryInfo"
                }
            },
            {
                $unwind:"$categoryInfo"
            },
            {
                $project:{
                    _id:0,
                    categoryName:"$categoryInfo.name",
                    totalQuantity:1
                }
            }
        ]
    }else{
        filter.order = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // 1st of current month
                  },
                }
            },
            {
            $group:{
                _id:{$month:'$orderDate'},
                totalOrders:{$sum:1}
            }
        },
    {
        $sort:{_id:1}
    }
]
        filter.sales = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // 1st of current month
                  },
                  status: { $in: ['Delivered', 'Return-cancelled'] }
                }
            },
            {
                $group:{
                    _id:{$month:'$orderDate'},
                    totalRevenue:{$sum:"$totalPrice"}
                }
            },
            {
                $sort:{_id:1}
            }
        ]

        filter.user = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // 1st of current month
                  },
                }
            },
            {
                $group:{
                    _id:{$month:'$createdAt'},
                    totalUsers:{$sum:1}
                }
        
            },
            {
                $sort:{_id:1}
            }
        ]

        filter.category = [
            {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // 1st of current month
                  },
                  status: { $in: ['Delivered', 'Return-cancelled'] }
                }
            },
              
            {$unwind:"$items"},
            {$lookup:{
                from:"products",
                localField:"items.productId",
                foreignField:"_id",
                as:"productDetails"
            }},
            {
                $unwind:"$productDetails"

            },
            {
                $group:{
                    _id:"$productDetails.category",
                    totalQuantity:{$sum:"$items.quantity"}
                }
            },
            {
                $lookup:{
                    from:"categories",
                    localField:"_id",
                    foreignField:"_id",
                    as:"categoryInfo"
                }
            },
            {
                $unwind:"$categoryInfo"
            },
            {
                $project:{
                    _id:0,
                    categoryName:"$categoryInfo.name",
                    totalQuantity:1
                }
            }
        ]
    }

    return  filter

}

const loadDashboardChart = async (req,res) =>{

    try {
        const timeFilter = req?.query?.timeFilter 

        let label ;
        console.log(timeFilter)
        if(timeFilter == "weekly"){
            label = ["sun","mon","Tue","Wed","Thu","Fri","Sat"]

        }else if(timeFilter == "yearly"){
            
            label = ['2020', '2021', '2022', '2023', '2024','2025'];
        }else{
            label = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        }

            function _formatChartData(data, timeFilter) {
                return data.reduce((acc, cur) => {
                    if (timeFilter === "weekly") acc.label.push(label[cur._id - 1] ?? cur.categoryName ?? "wed");
                    else if (timeFilter === "yearly") acc.label.push(cur._id?.toString() ?? cur.categoryName ?? "wed");
                    else acc.label.push(label[cur._id - 1]);
                    acc.value.push(cur.totalOrders || cur.totalRevenue||cur.totalrevenue || cur.totalUsers || cur.totalQuantity); 
                    return acc;
                }, { label: [], value: [] });
            }

        let filter = _chartFilter(timeFilter)
        let orderData = await Order.aggregate(filter.order)
        let salesData = await Order.aggregate(filter.sales)

        let userData = await User.aggregate(filter.user)

        let categoryData = await Order.aggregate(filter.category)
        
        console.log(salesData)
        orderData = _formatChartData(orderData,timeFilter)
        // console.log(orderData)
        salesData = _formatChartData(salesData,timeFilter)
        userData = _formatChartData(userData,timeFilter)
        // console.log(userData)
        categoryData = _formatChartData(categoryData,timeFilter)
        
        orderData = fillLabels(orderData,label)
        userData = fillLabels(userData,label)
        salesData = fillLabels(salesData,label)
        
        res.status(200).json({orderData,userData,salesData,categoryData})
    } catch (error) {
        console.log(error)
    }
}


function fillLabels(data, fullLabels) {
  const labelToValue = {};

  // Map existing labels to their values
  for (let i = 0; i < data.label.length; i++) {
    labelToValue[data.label[i]] = data.value[i];
  }

  // Create full label and value arrays
  const newLabels = [];
  const newValues = [];

  for (let label of fullLabels) {
    newLabels.push(label);
    newValues.push(labelToValue[label] !== undefined ? labelToValue[label] : 0);
  }

  return { label: newLabels, value: newValues };
}

  
// loadDashboardChart()

module.exports ={
    loadDashboardChart,
    renderAdminDashboard,

}