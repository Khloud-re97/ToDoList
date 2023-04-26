//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}



const itemsSchema = new mongoose.Schema({
  name: String
});

//Capitlize the first litter of the model name
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];
// Item.insertMany(defaultItems);
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  // const day = date.getDate();
  Item.find().then(function(items) {

      //So we do not need to use ctrl c each time to close the connection
      // mongoose.connection.close();

      if (items.length === 0) {
        Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: items
        });
      }


    })
    .catch(function(err) {
      console.log(err);
    });

  // To find all we can just use the command Item.find({});

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = _.startCase(req.body.list);
  const userItem = new Item({
    name: itemName
  });
  if (listName === "Today") {
    userItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }).then(function(foundList) {
      // console.log(foundList);
      foundList.items.push(userItem);
      foundList.save();
      res.redirect("/" + listName);

    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID).then(function() {
      console.log("Successsfully deleted the checked item."); // Success
      res.redirect("/");
    }).catch(function(error) {
      console.log(error); // Failure
    });
  } else {
    // We need to remove an element from an array
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemID
        }
      }
    }).then(function(foundList) {
      res.redirect("/" + listName);
    });
  }

});

app.get("/:listName", function(req, res) {
  const listName = _.startCase(req.params.listName);

  List.findOne({
    name: listName
  }).then(function(foundList) {
    if (!foundList) {
      //Create a new list
      // console.log("Does Not exists");
      const list = new List({
        name: listName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + listName);
    } else {
      //Show the list
      // console.log("Exists")
      res.render("list", {
        listTitle: listName,
        newListItems: foundList.items
      });
    }
  });
});






app.get("/about", function(req, res) {
  res.render("about");
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
})
