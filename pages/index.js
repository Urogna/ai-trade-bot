import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import brain from "brain.js/src"
import { useEffect, useState } from "react"
import Papa from 'papaparse'

export default function Home() {
	// provide optional config object (or undefined). Defaults shown.
	const daysData = []
	const finalData = []
	const config = {
		// hiddenLayers: [25, 5],
		binaryThresh: 0.5,
		activation: "sigmoid", // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
		// leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
	}
	const [display, setDisplay] = useState("")
	const [net, setNet] = useState(new brain.NeuralNetwork(config))
	const [symbolCounter, setSymbolCounter] = useState(0)

	const DAYS_SPAN = 30
	const MODIFIER = 10

	// create a simple feed forward neural network with backpropagation

	const prepareData = (e) => {
		var csvType = "text/csv"
		console.log(Array.from(e.currentTarget.files))
		Array.from(e.currentTarget.files).forEach((file) => {
				Papa.parse(file, {
					dynamicTyping: true,
					complete: (results) => {
						results.data.forEach((day, idx) => {
							if (idx < 1) return
							const result =
								(Math.min(
									Math.max(
										MODIFIER * (day[4] / day[1] - 1),
										-1
									),
									1
								) +
									1) /
								2

							if (idx > DAYS_SPAN + 1) {
								finalData.push({
									input: daysData.slice(
										daysData.length - DAYS_SPAN,
										daysData.length
									),
									output: [result], //[next[0], next[1], next[2], next[3]],
								})
							}
							daysData.push(result)
						})
						document.getElementById("csvData").innerHTML = finalData.length
					},
				})
		})
	}

	const showContent = () => {
		fetch('api/train', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(finalData)
		}).then((res) => {
			return res.json()
		}).then((data) => {
			console.log(JSON.stringify(data, null, 2))
			document.getElementById("csvData").innerHTML = JSON.stringify(data, null, 2)
			net.fromJSON(data)
		})
	}

	const loadNet = () => {
		fetch("data/nets/net_3.json")
			.then((response) => {
				return response.json()
			})
			.then((data) => {
				document.getElementById("csvData").innerHTML = JSON.stringify(
					data,
					null,
					2
				)
				net.fromJSON(data)
			})
	}

	const showPrediction = () => {
		var csvString = document.getElementById("inputText").value
		const results = Papa.parse(csvString, {
			newline: "\n",
			dynamicTyping: true,
		})
		const testData = results.data.map((day, idx) => {
			return (
				(Math.min(Math.max(MODIFIER * (day[4] / day[1] - 1), -1), 1) +
					1) /
				2
			)
		})
		console.log(testData)
		const output = net.run(testData)
		const previous = testData[testData.length - 1]
		document.getElementById(
			"outputData"
		).innerHTML = `Output: ${JSON.stringify(output)}, Prev: ${previous}`
	}
	const getPredictionJSON = (data) => {
		const results = data.results.map((i) => {
			return Object.values(i)
		})
		const testData = results
			.slice(results.length - 30, results.length)
			.map((day, idx) => {
				return (
					(Math.min(
						Math.max(MODIFIER * (day[4] / day[1] - 1), -1),
						1
					) +
						1) /
					2
				)
			})
		console.log(testData)
		const output = net.run(testData)
		const previous = testData[testData.length - 1]
		return output['0']
	}

	const showAccuracy = (e) => {
		let counter = 0
		let sum = 0
		let averageWin = 0
		let averageLoss = 0
		let counterScuffed = 0
		let sumScuffed = 0
		let counterTop = 0
		let sumTop = 0
		let counterTotal = 0
		let sumTotal = 0
		let averageWinTotal = 0
		let averageLossTotal = 0
		var csvType = "text/csv"
		Array.from(e.currentTarget.files).forEach((file) => {
			const testData = []
			if (true) {
				Papa.parse(file, {
					dynamicTyping: true,
					complete: (results) => {
						results.data.forEach((day, idx) => {
							if (idx < 1) return

							testData.push([
								(Math.min(
									Math.max(
										MODIFIER * (day[4] / day[1] - 1),
										-1
									),
									1
								) +
									1) /
									2,
								day[4] / day[1],
								day[2] / day[1],
								day[3] / day[1],
							])
						})
						const t = new Date().getTime()

						for (let i = DAYS_SPAN; i < testData.length; i++) {
							let output = net.run(
								testData
									.slice(i - DAYS_SPAN, i)
									.map((item) => item[0])
							)
							let next = testData[i][0]
							if (output["0"] > 0.9 || output["0"] < 0.1) {
								if (
									(output["0"] >= 0.5 && next >= 0.5) ||
									(output["0"] < 0.5 && next < 0.5)
								) {
									counterTop++
									sumTop++
								} else {
									sumTop++
								}
							} else if (output["0"] > 0.52 || output["0"] < 0.48) {
								if (output["0"] >= 0.5 && next >= 0.5) {
									averageWin += testData[i][1]
									counter++
								} else if (output["0"] < 0.5 && next < 0.5) {
									averageWin += 1 / testData[i][1]
									counter++
								} else {
									if (next >= 0.5) {
										averageLoss += testData[i][1]
									} else {
										averageLoss += 1 / testData[i][1]
									}
								}
								sum++
							} else {
								if (
									(output["0"] >= 0.5 && next >= 0.5) ||
									(output["0"] < 0.5 && next < 0.5)
								) {
									counterScuffed++
									sumScuffed++
								} else {
									sumScuffed++
								}
							}
							if (
								output["0"] >= 0.5 && next >= 0.5
								
							) {
								averageWinTotal += testData[i][1]
								counterTotal++
							} else if (output["0"] < 0.5 && next < 0.5) {
								averageWinTotal += 1 / testData[i][1]
								counterTotal++
							} else {
								if (next >= 0.5) {
									averageLossTotal += testData[i][1]
								} else {
									averageLossTotal += 1 / testData[i][1]
								}
							}
							sumTotal++
						}
						document.getElementById(
							"accuracyData"
						).innerHTML = `Accuracy (0.53): ${
							(100 * counter) / sum
						}% (${sum} avg: ${averageWin / counter}, avg_l: ${
							averageLoss / (sum - counter)
						})<div>Scuffed (0.5): ${
							(100 * counterScuffed) / sumScuffed
						}% (${sumScuffed})</div><div>Top (0.7): ${
							(100 * counterTop) / sumTop
						}% (${sumTop})</div><div>Total : ${
							(100 * counterTotal) / sumTotal
						}% (${sumTotal} avg: ${averageWinTotal / counterTotal}, avg_l: ${
							averageLossTotal / (sumTotal - counterTotal)
						})</div>`
					},
				})
			} else {
				fileDisplayArea.innerText = "File not supported!"
			}
		})
	}

	const showHistory = (symbol) => {
		// let day = 86400000
		// yahooFinance
		// 	.historical(symbol, {
		// 		period1: new Date().getTime() - 60 * day,
		// 	})
		// 	.then((res) => {
		// 		return res.json()
		// 	})
		// 	.then((data) => {
		// 		setDisplay(data)
		// 	})
		fetch(`api/${symbol}`)
			.then((res) => {
				return res.json()
			})
			.then((data) => {	
				const prediction = getPredictionJSON(data)
				setDisplay(`${symbol} : ${prediction}`)
				if(prediction < 0.6 && prediction > 0.4) {
					
				}
			})
		setSymbolCounter(symbolCounter + 1)
	}

	return (
		<div className={styles.container}>
			<Head>
				<title>Create Next App</title>
				<meta
					name="description"
					content="Generated by create next app"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<div id="page-wrapper">
				<div>
					Select a text file:
					<input
						type="file"
						onChange={prepareData}
						webkitdirectory="true"
						mozdirectory="true"
						msdirectory="true"
						odirectory="true"
						directory="true"
						multiple={true}
					/>
				</div>
				<pre id="fileDisplayArea"></pre>
			</div>
			<p id="csvData"></p>
			<button onClick={showContent}>Train</button>

			<button onClick={loadNet}>Load:</button>
			<div>
				<div>
					Paste CSV of 30 days:
					<textarea id="inputText"></textarea>
				</div>
			</div>
			<p id="outputData"></p>
			<button onClick={showPrediction}>Predict</button>
			<div>
				<div>
					Accuracy
					<input
						type="file"
						onChange={showAccuracy}
						webkitdirectory="true"
						mozdirectory="true"
						msdirectory="true"
						odirectory="true"
						directory="true"
						multiple={true}
					/>
				</div>
			</div>
			<p id="accuracyData"></p>
			<div>
				{/* <input
					type="text"
					placeholder="Starting capital"
					value={symbol}
					onChange={(e) => {
						e.preventDefault()
						setSymbol(e.currentTarget.value)
					}}
				/> */}
				<p>{JSON.stringify(display, null, 2)}</p>
				<button onClick={() => {
					showHistory(symbols[symbolCounter])
				}}>Show history</button>
			</div>
		</div>
	)
}

const symbols = [
	'TRX-USD',
	'BTC-USD',
	'AEP',
	'EXC',
	'XEL',
	'ADBE',
	'AMD',
	'ADI',
	'ANSS',
	'AAPL',
	'AMAT',
	'ASML',
	'TEAM',
	'ADSK',
	'ADP',
	'AVGO',
	'CDNS',
	'CDW',
	'CHKP',
	'CSCO',
	'CTSH',
	'DOCU',
	'FISV',
	'INTC',
	'INTU',
	'KLAC',
	'LRCX',
	'MRVL',
	'MXIM',
	'MCHP',
	'MU',
	'MSFT',
	'NVDA',
	'NXPI',
	'OKTA',
	'PAYX',
	'PYPL',
	'QCOM',
	'SWKS',
	'SPLK',
	'SNPS',
	'TXN',
	'VRSN',
	'WDAY',
	'XLNX',
	'ZM',
	'CTAS',
	'CPRT',
	'CSX',
	'FAST',
	'PCAR',
	'VRSK',
	'ALXN',
	'ALGN',
	'AMGN',
	'BIIB',
	'CERN',
	'DXCM',
	'GILD',
	'IDXX',
	'ILMN',
	'INCY',
	'ISRG',
	'MRNA',
	'REGN',
	'SGEN',
	'VRTX',
	'COST',
	'KDP',
	'KHC',
	'MDLZ',
	'MNST',
	'PEP',
	'WBA',
	'AMZN',
	'BKNG',
	'DLTR',
	'EBAY',
	'JD',
	'LULU',
	'MAR',
	'MELI',
	'ORLY',
	'PTON',
	'PDD',
	'ROST',
	'SBUX',
	'TSLA',
	'TCOM',
	'ATVI',
	'GOOGL',
	'GOOG',
	'BIDU',
	'CMCSA',
	'EA',
	'FB',
	'FOXA',
	'FOX',
	'MTCH',
	'NTES',
	'NFLX',
	'SIRI',
	'TMUS',
]