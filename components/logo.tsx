"use client"

import { useEffect, useRef, useCallback } from "react"

type Props = {
  width?: number
  className?: string
  pxPerMs?: number
  drawColor?: string
  finalColor?: string
  strokeWidth?: number

  replayOnHover?: boolean
}

export default function AnimatedLogo({
  width,
  className,
  pxPerMs = 0.55,
  drawColor = "#9ca3af",
  finalColor = "#ffffff",
  strokeWidth = 2,
  replayOnHover = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  const play = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    clearTimers()

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"))
    if (!paths.length) return

    // reset do stanu początkowego
    paths.forEach((p) => {
      const len = p.getTotalLength()
      p.style.transition = "none"
      p.style.stroke = drawColor
      p.style.strokeWidth = String(strokeWidth)
      p.style.strokeLinecap = "round"
      p.style.strokeLinejoin = "round"
      p.style.fill = finalColor
      p.style.fillOpacity = "0"
      p.style.strokeDasharray = `${len}`
      p.style.strokeDashoffset = `${len}`
    })

    if (reduceMotion) {
      paths.forEach((p) => {
        p.style.transition = "none"
        p.style.stroke = finalColor
        p.style.strokeDasharray = "none"
        p.style.strokeDashoffset = "0"
        p.style.fillOpacity = "1"
      })
      return
    }

    const lengths = paths.map((p) => p.getTotalLength())
    const durations = lengths.map((len) => Math.max(300, len / pxPerMs))
    const finishTime = Math.max(...durations)
    const delays = durations.map((d) => finishTime - d)


    void svg.getBoundingClientRect()

    // start rysowania
    requestAnimationFrame(() => {
      paths.forEach((p, i) => {
        p.style.transition = `stroke-dashoffset ${durations[i]}ms ease-in-out ${delays[i]}ms`
        p.style.strokeDashoffset = "0"
      })
    })

    const t1 = window.setTimeout(() => {
      paths.forEach((p) => {
        p.style.transition = `stroke 500ms ease, fill-opacity 900ms ease`
        p.style.stroke = finalColor
      })
    }, finishTime + 50)
    const t2 = window.setTimeout(() => {
      paths.forEach((p) => {
        p.style.fillOpacity = "1"
      })
    }, finishTime + 150)

    timersRef.current.push(t1, t2)
  }, [drawColor, finalColor, pxPerMs, strokeWidth])

  useEffect(() => {
    play()
    return () => clearTimers()
  }, [play])

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 677 217"
      className={className ?? (width ? "" : "w-96 h-auto")}
      style={width ? { width, height: "auto" } : undefined}
      onMouseEnter={replayOnHover ? play : undefined}
    >
      <path d="M69.4756 3.25635C90.3966 1.07666 103.119 4.54797 112.298 12.6196C121.696 20.8841 127.462 34.0271 134.396 51.229L134.484 51.4507L134.713 51.52C141.123 53.4774 147.091 56.0649 151.797 59.2642C156.36 62.366 159.697 66.0161 161.145 70.188L161.279 70.5933C166.246 86.4008 181.174 97.5781 201.031 99.5396C207.012 108.839 208.899 117.869 208.059 126.301C207.284 134.071 204.192 141.362 199.809 147.908C200.973 139.239 198.36 131.321 192.07 127.699C186.49 124.486 179.408 125.474 173.038 129.455C172.434 124.502 170.155 120.308 166.226 118.048C163.272 116.343 159.826 115.998 156.337 116.768C156.734 112.826 155.742 109.144 153.149 106.565C150.171 103.595 145.75 102.734 141.128 103.656C141.186 101.256 140.466 99.0374 138.849 97.4243L138.656 97.2397C136.648 95.3792 133.785 94.8121 130.803 95.3325C127.722 95.8701 124.466 97.5708 121.741 100.286C119.016 103.001 117.309 106.247 116.769 109.318C116.229 112.387 116.853 115.33 118.865 117.337C119.886 118.356 121.152 119.017 122.551 119.35C120.039 125.341 120.367 131.562 124.215 135.395C127.192 138.365 131.621 139.228 136.243 138.305C133.927 147.135 135.973 155.729 142.291 159.366C146.472 161.775 151.629 161.47 156.505 159.133C156.539 166.132 159.225 172.218 164.511 175.259V175.26C165.05 175.571 165.604 175.841 166.17 176.074C161.624 178.111 157.785 179.144 155.294 179.061C143.637 177.487 129.253 168.802 116.016 155.953C102.826 143.15 90.842 126.278 83.8975 108.385C84.9319 105.59 86.0117 102.569 87.0781 99.4175L87.2393 98.9409L86.7627 98.7827C71.1414 93.597 60.2442 96.4558 53.7305 104.202C47.2611 111.895 45.2468 124.267 47.0156 137.841C50.4532 164.22 68.2435 195.616 96.5654 207.244H9.52051V71.4224C17.3173 46.4199 43.7347 35.7623 67.3701 40.9312L67.4131 40.9409L67.4561 40.9429C78.3508 41.409 90.0711 43.2934 102.563 46.8706L103.573 47.1606L103.161 46.1938C96.8619 31.4338 84.6875 15.3974 69.4756 3.25635Z" />
      <path d="M261.915 82.3198V102.967H299.932V82.3198H318.235V139.761H299.932V118.014H261.915V139.761H243.696V82.3198H261.915ZM348.764 82.3198L348.914 82.5015L367.695 105.301L386.31 82.5034L386.46 82.3198H409.334L408.62 83.147L376.934 119.816V139.761H358.631V119.818L326.438 83.1499L325.71 82.3198H348.764ZM467.191 82.3198C472.333 82.3198 476.653 82.7449 480.141 83.604C483.625 84.4624 486.312 85.7624 488.15 87.5376C489.992 89.316 491.341 91.9502 492.231 95.3872C493.122 98.8268 493.562 103.103 493.562 108.206V114.721C493.562 117.372 493.506 119.258 493.39 120.359C493.328 121.474 493.012 123.695 492.452 126.991C491.86 130.42 489.817 133.401 486.405 135.939C482.966 138.498 478.67 139.761 473.553 139.761H416.817V82.3198H467.191ZM559.282 82.3198C566.104 82.3198 571.093 83.6474 574.121 86.4224L574.407 86.6851C577.315 89.4636 578.697 94.1796 578.697 100.674C578.697 103.229 578.557 105.429 578.271 107.267L578.27 107.269C577.974 109.13 577.393 110.776 576.504 112.195L576.498 112.203C575.616 113.552 574.575 114.598 573.364 115.32L573.357 115.325L573.35 115.329C572.397 115.852 570.628 116.55 568.076 117.424C571.076 117.998 573.406 118.93 575.03 120.251C577.069 121.856 578.021 124.641 578.021 128.43V139.761H559.547V133.845C559.547 131.104 559.293 128.961 558.805 127.394C558.633 126.773 558.126 126.252 557.097 125.875C556.061 125.495 554.567 125.292 552.585 125.292H524.329V139.761H506.11V82.3198H559.282ZM642.937 82.3198L643.079 82.5796L673.952 139.021L674.357 139.761H654.212L654.071 139.493L648.868 129.522H612.912L607.454 139.501L607.312 139.761H586.993L587.409 139.017L618.964 82.5757L619.107 82.3198H642.937ZM435.036 124.968H463.544C466.176 124.968 468.287 124.723 469.892 124.249C471.498 123.773 472.551 123.081 473.141 122.223L473.146 122.215L473.267 122.041C473.857 121.141 474.327 119.845 474.652 118.12C474.998 116.285 475.174 113.998 475.174 111.252V110.745C475.174 107.997 475.019 105.713 474.714 103.888C474.408 102.056 473.956 100.722 473.388 99.8462C472.858 99.0296 471.844 98.3597 470.234 97.897C468.629 97.4355 466.489 97.1978 463.799 97.1978H435.036V124.968ZM619.477 116.844H642.055L630.766 96.0522L619.477 116.844ZM524.329 110.583H552.075C554.01 110.583 555.557 110.464 556.729 110.233C557.916 109.999 558.643 109.662 559.018 109.29C559.4 108.906 559.732 108.238 559.963 107.208C560.192 106.185 560.312 104.857 560.312 103.213C560.312 101.37 560.114 100.073 559.761 99.2671L559.756 99.2563L559.752 99.2446C559.48 98.5286 558.872 97.9942 557.787 97.686L557.78 97.6841C556.668 97.3507 555.775 97.1646 555.092 97.1118C554.369 97.0565 553.508 97.0278 552.497 97.0278H524.329V110.583Z" />
    </svg>
  )
}
