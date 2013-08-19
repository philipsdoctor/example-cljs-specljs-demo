(ns query-service.core
  (:require [cljs.core.async :as async]))

(defn nil-or-empty?
  [x]
  (if (or (nil? x) (= (count x) 0)) true false))

(defn validate-register-pane
  "Basic validation of register-pane"
  [pane-name fields facets]
  (if (and (nil-or-empty? fields) (nil-or-empty? facets))
    (throw (js/Error. "Either fields or facets must be specified")))
  (if (nil? pane-name)
    (throw (js/Error. "Pane-name must be specified"))))  

(defn register-pane 
  "Components will consume the query-service by registering their pane with this method.
   The method requires a pane-name, a vector of fields and/or facets and an optional channel 
   from the pane.  This returns a map of :from-pane :to-pane which contains corresponding channels" 
  [& {:keys [pane-name channel fields facets]}]
  (validate-register-pane pane-name fields facets)
  {
    :from-pane (or channel (async/chan)) 
    :to-pane (async/chan)
  }
  )


