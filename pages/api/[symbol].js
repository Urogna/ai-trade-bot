// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import yahooFinance from "yahoo-finance2"

export default (req, res) => {
	const query = req.query.symbol
	const day = 86400000
	const date = new Date().getTime() - 60 * day
	const queryOptions = {
		period1: new Date(date),
	}
	yahooFinance
		.historical(query, queryOptions)
		.then((results) => {
			res.status(200).json({ results })
		})
		.catch((e) => {
			res.status(400).json({ e })
		})
}
