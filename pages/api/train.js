import brain from 'brain.js'

export default function handler(req, res) {
    if (req.method === 'POST') {
      console.log(req.body)
      const net = new brain.NeuralNetwork([30, 5])
      net.train(req.body)
      res.status(200).json(net.toJSON())
    } else {
      // Handle any other HTTP method
    }
  }

  export const config = {
    api: {
      bodyParser: {
        sizeLimit: '25mb',
      },
    },
  }