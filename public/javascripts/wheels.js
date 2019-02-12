let CircleCreator = {

  values: {
    multiplier: 2,
    selector: ".wheel-container",
    customDom: false,
    spacing: 3,
  },

  template: {
    main: `
      <div class="wheel-overlay">
        <div class="wheel">
          <div class="wheel-center">
            <div class="question">$</div>
          </div>
        </div>`,
    answer: `
      <div class="wheel-outer" id="wheel-outer-&">
        <div class="content">$</div>
      </div>`,
  },

  helpers: {
    escapeHtml: function (unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  },

  recalculate: function () {

    let self = this
    let centerSize = $('.question').width()
    let centerSizeMultiplier = this.values.multiplier
    let borderSize = centerSize / 2
    let distance = centerSize * Math.pow(centerSizeMultiplier, 1.9)
    let nbOuter = $('.wheel-outer').length
    let wheelAngle = 360 / nbOuter
    let spacing = this.values.spacing

    console.log('centerSize:', centerSize);
    console.log('distance:', distance);

    $('.big-wheel').remove()
    $('.wheel-center').css('border-width', borderSize + "px")


    let i = 1
    $('.wheel-outer').each(function (wheel) {
      let coverage = $(this).attr('data-coverage')
      let angle = wheelAngle * i
      let myWheel = $('.wheel').append('<div class="big-wheel" id="big-wheel-' + i + '">')

      let x = Math.round(Math.cos(angle * Math.PI / 180) * centerSize * centerSizeMultiplier)
      let y = Math.round(Math.sin(angle * Math.PI / 180) * centerSize * centerSizeMultiplier)

      x += centerSize
      y += centerSize

      // Apply Style
      $(this).attr('data-outer', i)
      $(this).css('top', x)
      $(this).css('left', y)
      $(this).height(centerSize * (centerSizeMultiplier - 1))
      $(this).width(centerSize * (centerSizeMultiplier - 1))
      $(this).hover(function () {
        let wheel = $(this).attr('data-outer')
        if (nbOuter != wheel)
          wheel = nbOuter - wheel
        $('#big-wheel-' + wheel).toggleClass('hovered')
      })

      let polygon = self.computeClipPath(angle, wheelAngle, spacing)
      $('#big-wheel-' + i).css('clip-path', polygon)
      i++

    })

    $('.wheel-center').height(centerSize * centerSizeMultiplier)
    $('.wheel-center').width(centerSize * centerSizeMultiplier)

    $('.big-wheel').height(distance)
      .width(distance)
  },

  computeClipPath: function (angle, angleSize, spacing) {


    // Change the value of angle and angleSize to match the view
    let angleSpacing = angleSize / 2
    angle += 90

    // First value is the center
    // It is fixed in the middle
    let val1 = "50% 50%"

    // The next one is equal to the projection on the square of the angle
    // using <angle>
    let val2Angle = this.computeAngles(angle - angleSpacing + spacing)
    let val2 = this.formatAngle(val2Angle)

    // The next one is the middle
    // using <midAngle>
    let val3Angle = this.computeMiddleAngle(angle)
    let val3 = this.formatAngle(val3Angle)

    // The next one is the last part
    // using <angle+angleSize>
    let val4Angle = this.computeAngles(angle + angleSpacing - spacing)
    let val4 = this.formatAngle(val4Angle)

    let polygon = `polygon( ${val1}, ${val2}, ${val3}, ${val4})`
    // Display based on the number of points
    if (this.values.answers.length <= 5) {
      let valIntermediateAngle1 = this.computeMiddleAngle(angle - (angleSpacing / 2) + (spacing / 2))
      let valIntermediate1 = this.formatAngle(valIntermediateAngle1)


      let valIntermediateAngle2 = this.computeMiddleAngle(angle + (angleSpacing / 2) - (spacing / 2))
      let valIntermediate2 = this.formatAngle(valIntermediateAngle2)

      polygon = `polygon( ${val1}, ${val2}, ${valIntermediate1}, ${val3},  ${valIntermediate2}, ${val4})`
      console.log(polygon);
    }

    if (this.values.answers.length == 2) {

      // Hardcoded answers
      if (angle % 360 > 180) {
        polygon = `polygon( 50% 50%, 0% 46%, 0% 0%, 100% 0%, 100% 46%)`
      } else {
        polygon = `polygon( 50% 50%, 0% 54%, 0% 100%, 100% 100%, 100% 54%)`
      }

    }


    return polygon

  },

  computeAngles: function (angle) {
    angle = angle * Math.PI / 180

    let cos = Math.cos(angle)
    let sin = Math.sin(angle)

    cos = Math.round(cos * 50 + 50)
    sin = Math.round(sin * 50 + 50)

    return {
      cos,
      sin
    }
  },

  computeMiddleAngle: function (angle) {
    angle = angle * Math.PI / 180

    let cos = Math.cos(angle)
    let sin = Math.sin(angle)

    cos = Math.round(cos * 50)
    cos = cos > 0 ? cos + 8 : cos - 8
    cos += 50
    sin = Math.round(sin * 50)
    sin = sin > 0 ? sin + 8 : sin - 8
    sin += 50

    return {
      cos,
      sin
    }
  },

  formatAngle: function (objAngle) {
    let a = objAngle.cos + "%"
    let b = objAngle.sin + "%"

    return a + " " + b
  },

  createDom: function () {

    if (!this.values.customDom) {
      return
    }


    let html = this.template.main
    let answer = this.template.answer

    html = html.replace('$', this.values.question)
    console.log('html:', html);

    // Insert main content
    $(this.values.selector)
      .empty()
      .append(html)

    // Then insert question
    let self = this
    let $wheel = $(this.values.selector).find('.wheel')
    this.values.answers.forEach(function (answer, i) {
      let a = (' ' + self.template.answer).substr(1)
      a = a
        .replace('&', i)
        .replace('$', answer)
      $wheel.append(a)
    })

  },

  init: function (o = {}) {
    // gather
    if (typeof o.multiplier == "number")
      this.values.multiplier = o.multiplier
    if (typeof o.customDom == "boolean" && o.customDom === true)
      this.values.customDom = o.customDom
    if (typeof o.question == "string")
      this.values.question = this.helpers.escapeHtml(o.question)
    if (typeof o.selector == "string")
      this.values.selector = o.selector
    if (typeof o.answers == "object" && o.answers.length != 0)
      this.values.answers = o.answers

    // change default
    if (this.values.multiplier < 1.7) {
      this.values.multiplier = 1.7
    }

    // create dom
    this.createDom()

    // calculate
    this.recalculate()
  },
}
CircleCreator.init({
  multiplier: 3,
  selector: ".wheel-container",
  customDom: true,
  question: "Use the <question> property to add your question",
  answers: [
    "42", "Cat", "42", "Cat", "42", "Cat", "42", "Cat"
  ]
})
