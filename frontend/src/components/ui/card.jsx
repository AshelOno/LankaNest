import * as React from "react"
import PropTypes from "prop-types"
import { cn } from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-slate-200 bg-white/95 text-card-foreground shadow-[0_12px_30px_rgba(10,65,116,0.07)] backdrop-blur-sm transition-shadow hover:shadow-[0_18px_42px_rgba(10,65,116,0.1)]",
      className
    )}
    {...props} />
))
Card.displayName = "Card"
Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 border-b border-slate-100 bg-blue-50/45 p-5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"
CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-base font-bold leading-none text-slate-950", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"
CardTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"
CardDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-5 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"
CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
CardFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
