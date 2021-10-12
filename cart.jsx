
// =========Products=============
const products = [
  { name: "Apples", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
];
//=========Cart=============
const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  //console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};
// useDataApi is called in products
const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  // useEffect is called whenever url changes; fetches data
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]); // url is tracked -- change triggers useEffect
  return [state, setUrl]; // after fetch, data is returned in state
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

// web component
const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const { Card, Accordion, Button, Container, Row, Col, Image, Input } = ReactBootstrap;
  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("http://localhost:1337/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(   // calling useDataApi here. // data comes back as data
    "http://localhost:1337/products",
    {
      data: [],
    }
  );
  console.log(`Rendering Products ${JSON.stringify(data)}`);

  // Add item to cart
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    console.log(`add to Cart ${JSON.stringify(item)}`);
   //added: 
   if(item[0].instock == 0 )return;
   //added:
   item[0].instock = item[0].instock-1;
    setCart([...cart, ...item]);
  };

  // remove item from cart

  const deleteCartItem = (index) => {
    
    console.log(cart);
    let itemDeleted = cart[index];
    let newCart = cart.filter((item, i) => index != i);
    console.log("item deleted: " + itemDeleted);

    items.map((item) => {
      if (item.name === itemDeleted.name) {
          item.instock = item.instock + 1;
      }
    });
    setItems(items);
    setCart(newCart);
  };
  
  const photos = ["apples.jpg", "oranges.jpg", "beans.jpg", "cabbage.jpg"];


  let list = items.map((item, index) => {
   // let n = index + 1049;
   // let url = "https://picsum.photos/id/" + n + "/50/50";

   return (
    // list of products. created each time list is rendered
    <li key={index}>
      <div className="container">
        <div className="d-sm p-2">
          <Image src={photos[index % 4]} width={70}></Image>
          <Button variant="light" size="large">{item.name}: ${item.cost}</Button>
          <p>In Stock: {item.instock}</p>     
          <input name={item.name} type="submit" onClick={addToCart} value="Add to Cart"></input>
          <br></br>
          <br></br>
        </div>
      </div>
    </li>
  );
});

  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            {item.name}
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse
          onClick={() => deleteCartItem(index)}
          eventKey={1 + index}
        >
          <Card.Body>
            $ {item.cost} from {item.country}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };
  // takes url. doFetch sets the url using useState. When useState is changed, fetch is triggered
  const restockProducts = (url) => {
    doFetch(url);
    // data comes back as array of new products (data)
    let newItems = data.map((item) => {
      // destructure item into an object
      // because we're in need of only certain fields that come back from strapi
       let { name, country, cost, instock } = item;
      //added:
       let t = items.find((element) => element.name == name);
       //added:
      instock = instock + t.instock;
      // return object as newItem (an array of list objects)
      return { name, country, cost, instock };
    });
    // add these to setItems by spreading present items and adding new items
    setItems([...items, ...newItems]);
  };

  // rendering //
  // list should have new items when we restock
  // Form > onsubmit calls restockProducts function. preventDefault prevents function from being called again
  return (
    <Container>
      <Row>
        <Col>
          <h3>Product List</h3>
          <ul style={{ listStyleType: "none" }}>{list}</ul> 
        </Col>
        <Col>
          <h3>Cart Contents</h3>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h3>CheckOut </h3>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            restockProducts(`http://localhost:1337/${query}`);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));