export default class EmotionalClassifier {
  constructor (model) {
    if (model) {
      this.init(model)
    }

    this.previousParameters = []
    this.emotions = []
    this.classifier = {}
    this.coefficientLength = 0;
  }

  init (model) {
    for (const emotion of Object.keys(model)) {
      const emotionData = model[emotion]
      this.emotions.push(emotion)
      this.classifier[emotion] = {
        bias: emotionData.bias,
        coefficients: emotionData.coefficients,
      }
    }

    this.coefficientLength = this.classifier[this.emotions[0]].coefficients.length
  }

  blankPrediction () {
    const prediction = []
    for (let i = 0; i < this.emotions.length; i++) {
      prediction[i] = {
        'emotion': this.emotions[i],
        'value': 0.0
      }
    }
    return prediction
  }

  predict (parameters) {
    const prediction = []
    for (let i = 0; i < this.emotions.length; i++) {
      const emotion = this.emotions[i]
      let score = this.classifier[emotion].bias

      for (let i = 0; i < this.coefficientLength; i++) {
        score += this.classifier[emotion].coefficients[i] * parameters[i + 6]
      }

      prediction[i] = {
        emotion,
        'value': 0.0
      }
      prediction[i].value = 1.0 / (1.0 + Math.exp(-score))
    }
    return prediction
  }

  meanPredict (parameters) {
    // store to array of 10 previous parameters
    this.previousParameters.splice(0, this.previousParameters.length == 10 ? 1 : 0)
    this.previousParameters.push(parameters.slice(0))

    if (this.previousParameters.length > 9) {
      // calculate mean of parameters?
      let meanParameters = []

      for (let i = 0; i < parameters.length; i++) {
        meanParameters[i] = 0
      }

      for (let i = 0; i < this.previousParameters.length; i++) {
        for (let j = 0; j < parameters.length; j++) {
          meanParameters[j] += this.previousParameters[i][j]
        }
      }

      for (let i = 0; i < parameters.length; i++) {
        meanParameters[i] /= 10
      }

      // calculate logistic regression
      return this.predict(meanParameters)
    } else {
      return false
    }
  }
}
