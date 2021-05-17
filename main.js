// provide optional config object (or undefined). Defaults shown.
const daysData = []
const finalData = []
const config = {
	hiddenLayers: [25, 5],
	binaryThresh: 0.5,
	activation: "sigmoid", // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
	leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
}

const DAYS_SPAN = 30
const MODIFIER = 10

// create a simple feed forward neural network with backpropagation
const net = new brain.NeuralNetwork(config)

const prepareData = (e) => {
	var csvType = "text/csv"

	e.target.files.forEach((file) => {
		if (file.type.match(csvType)) {
			Papa.parse(file, {
				dynamicTyping: true,
				complete: (results) => {
					results.data.forEach((day, idx) => {
						if (idx < 1) return
						const result =
							(Math.min(
								Math.max(MODIFIER * (day[4] / day[1] - 1), -1),
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
					document.getElementById("csvData").innerHTML = `Ready ${
						daysData.length
					}: ${JSON.stringify(finalData)}`
				},
			})
		} else {
			fileDisplayArea.innerText = "File not supported!"
		}
	})
}

const showContent = () => {
	const t = new Date().getTime()
	console.log(finalData)
	net.train(finalData)
	console.log(JSON.stringify(net.toJSON(), null, 2))
	document.getElementById("csvData").innerHTML = `Ready [${
		(new Date().getTime() - t) / 1000
	}]<div>${JSON.stringify(net.toJSON(), null, 2)}</div>`
}

const loadNet = () => {
	fetch("./net_4.json")
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
			(Math.min(Math.max(MODIFIER * (day[4] / day[1] - 1), -1), 1) + 1) /
			2
		)
	})
	console.log(testData)
	const output = net.run(testData)
	const previous = testData[testData.length - 1]
	document.getElementById("outputData").innerHTML = `Output: ${JSON.stringify(
		output
	)}, Prev: ${previous}`
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
	var csvType = "text/csv"
	e.target.files.forEach((file) => {
		const testData = []
		if (file.type.match(csvType)) {
			Papa.parse(file, {
				dynamicTyping: true,
				complete: (results) => {
					results.data.forEach((day, idx) => {
						if (idx < 1) return

						testData.push([
							(Math.min(
								Math.max(MODIFIER * (day[4] / day[1] - 1), -1),
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
						} else if (output["0"] > 0.6 || output["0"] < 0.4) {
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
							(output["0"] >= 0.5 && next >= 0.5) ||
							(output["0"] < 0.5 && next < 0.5)
						) {
							counterTotal++
							sumTotal++
						} else {
							sumTotal++
						}
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
					}% (${sumTotal})</div>`
				},
			})
		} else {
			fileDisplayArea.innerText = "File not supported!"
		}
	})
}
