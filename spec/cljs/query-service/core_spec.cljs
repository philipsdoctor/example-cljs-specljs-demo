(ns query-service.core-spec 
  (:require-macros [specljs.core :refer [describe it should should-not= should= should-throw should-not-throw]])
  (:require [specljs.core]
            [cljs.core.async :as async]
            [query-service.core :as qs]))

(describe "register-pane should return a map with :to-pane and :from-pane channels"
  (it "accepts specified constructor, returns channels"
    (let [ret-channels (qs/register-pane :pane-name "test-pane" :fields ["test-field"])]
      (should-not= (:from-pane ret-channels) nil)
      (should-not= (:to-pane ret-channels) nil)))

  (it "requires :pane-name to be specified"
    (should-throw js/Error (qs/register-pane :fields ["test-field"])))
  (it "requires either :fields or :facets to be specified"
    (should-throw js/Error (qs/register-pane :pane-name "test-pane")))
  (it "accepts :fields w/o :facets"
    (should-not-throw (qs/register-pane :pane-name "test-pane" :fields ["test-field"])))
  (it "accepts :facets w/o :fields"
    (should-not-throw (qs/register-pane :pane-name "test-pane" :facets ["test-facet"]))) 

  (it "returns the same channel in :from-pane if optional :channel is specified"
    (let [existing-channel (async/chan)]
    (should= (:from-pane (qs/register-pane :pane-name "test-pane" :fields ["test-field"] :channel existing-channel)) existing-channel)))

  
)

