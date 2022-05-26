export const dummyTradeApiCall = async(data: object) => {
    console.log({data}, 'process.env', process.env);
    
    const apiData = await fetch(`${process.env.DUMMY_SERVER_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
    })
    console.log({apiData});
    
}