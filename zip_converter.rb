require 'json'
require 'csv'

csv = CSV.read("zips.csv", headers: true)
json = {}
csv.each {|e| json[e["ZIP"]] = {lat: e["LAT"], lng: e["LNG"]}}

File.open("zips.json", "w") do |f|
  f.write(json.to_json)
end
