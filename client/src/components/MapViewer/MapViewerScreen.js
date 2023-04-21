import Button from '@mui/material/Button';
import MapEditor from './MapEditor';
import * as shapefile from "shapefile";
import na from './na.json'
import React, {useContext, useEffect, useState} from 'react';
import { useLocation } from 'react-router-dom';
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MapPropertySidebar from "./MapPropertySidebar";
import {CurrentModal, GlobalStoreContext, GlobalStoreContextProvider} from "../../store";
import ExportModal from "./MapViewerModal/ExportModal";
import MapClassificationModal from "./MapViewerModal/MapClassificationModal";
import MapColorwheelModal from "./MapViewerModal/MapColorwheelModal";
import MapMergeChangeRegionNameModal from "./MapViewerModal/MapMergeChangeRegionNameModal";
import MapAddRegionModal from "./MapViewerModal/MapAddRegionModal";
import {FormControl, InputAdornment} from "@mui/material";
import {Input} from "@mui/icons-material";
import ImportModal from "./MapViewerModal/ImportModal";
import MapLegendFooter from "./MapLegendFooter";
import {useParams} from 'react-router-dom';
import Box from "@mui/material/Box";

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as topoServer from 'topojson-server';
import * as topoClient from 'topojson-client';
import * as topoSimplify from 'topojson-simplify';


function MapViewerScreen(props){

    const [fileExist, setFileExist] = useState(false);
    // const [state, setState] = useState(true);
    const [data, setData] = useState([]);
    const { state } = useLocation();
    const [mapName,setMapChange] = useState('untitled');
    const [keyid, setKeyid] = useState(0)
    // const [compressCount, setCompressCount] = useState(0.005);

    const { store } = useContext(GlobalStoreContext);
    const [GeoJson, setGeoJson] = [store.currentMapData,store.setCurrentMapData]
    const { id } = useParams();
    // if (state){
    //     setMapChange(state.title);
    // }
    const names = [];
    let count = 0;
    let shpfile = null;
    let dbffile = null;

    // useEffect(() => {
    //     setGeoJson(na)
    // },[])


    useEffect(() => {
        if (state){
            setMapChange(state.title);
        }
        console.log("ID of map", id);
        // console.log(state);
        fetch(process.env.REACT_APP_API_URL + 'map/getMapById', {
            method: "post",
            credentials: 'include',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: id
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            let feat = JSON.parse(data.feature);
            if(feat.length === 0){
                return;
            }
            setMapChange(data.title);
            setGeoJson({type: data.type, features: feat});
        })
        .catch(err => console.log(err));
    },[])

    const sendImportReq = (geoJson) => {
        console.log("GEOJSON FILE UPLOADED", geoJson);
        fetch(process.env.REACT_APP_API_URL + 'map/importMapFileById', {
            method: "POST",
            credentials: 'include',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: id,
              geoJSONFile: geoJson
            }),
        })
        .then((res) => {
            res.json();
            if (res.status === 200) {
            console.log("LOGGED IN, going to your maps");
            }
        })
        .catch(err => console.log(err));
    }

    const handleSubmit = () => {
        setGeoJson({});
        console.log("shapefile.open")
        // console.log(shpfile)
        // console.log(dbffile)

        let geoJson = {
            type:"FeatureCollection",
            features: []
        }
        shapefile
            .open(
                shpfile,
                dbffile
            ).then(function (e){
            e.read().then(
                function next(result){
                    if(result.value) {
                        // console.log(result.value);
                        geoJson.features.push(result.value)
                    }
                    if(!result.done){
                        e.read().then(next)
                    }
                    else{

                        var temp = geoJson;

                        var topo = topoServer.topology({foo: temp});
                        topo = topoSimplify.presimplify(topo);
                        
                        topo = topoSimplify.simplify(topo, 0.005);
                        
                        temp = topoClient.feature(topo, topo.objects.foo);

                        initGeojsonGraphicalData(temp)
                        setGeoJson(temp)
                        sendImportReq(temp);
                        setFileExist(true);
                        setKeyid(keyid => keyid+1)
                    }
                })
        })
    }

    const changeRegionName = (oldName, newName) =>{
        // console.log("newold", oldName, newName);
        let temp = GeoJson;
        temp.features.forEach((i) => {
            if (i.properties.name === oldName) {
                i.properties.name = newName;
                setGeoJson(temp);
            }
        })
        // console.log("features", GeoJson.features);
        // setState(!state);
    }

    const upload = () => {
        // console.log("upload the stuff")
        // console.log(na)
        setGeoJson(na);
        setFileExist(true);
    }

    const Buttons = (Function,Text) => {
        const wrappedButton =

            <Grid item xs >
                <Button
                    style={{
                        width: "100%",
                        //backgroundColor: "#3c7dc3",

                    }}
                    sx={{bgcolor: '#4F46E5', color: 'white', fontWeight: 'bold', '&:hover': { bgcolor: '#3c348a' } }}
                    variant="contained"
                    onClick={Function}
                >
                    {Text}
                </Button>
            </Grid>

        return wrappedButton
    }

    const handleShpDbfFile = (e,type) => {
        {
            console.log("reading: "+ type);
            const reader = new FileReader();
            reader.readAsArrayBuffer(e.target.files[0]);
            reader.onload = async e => {
                if(type==="dbf")
                    dbffile = reader.result
                if(type==="shp")
                    shpfile = reader.result
                if(dbffile && shpfile){
                    console.log("done")
                    store.changeModal("NONE");
                    // setCompressCount(6);
                    handleSubmit()
                }
            }
        }
    }

    const handleGeoJson = (e) => {
        const reader = new FileReader();
        setGeoJson({});
        reader.readAsText(e.target.files[0]);
        reader.onload = e => {
            var temp = JSON.parse(e.target.result);

            var topo = topoServer.topology({foo: temp});
            topo = topoSimplify.presimplify(topo);
            
            topo = topoSimplify.simplify(topo, 0.005);
            console.log(topo)
            
            temp = topoClient.feature(topo, topo.objects.foo);
            initGeojsonGraphicalData(temp)
            setGeoJson(temp);
            sendImportReq(temp);
        }
        setFileExist(true);
        // store.changeModal("NONE");
        // setCompressCount(6);
    }

    function handleCompress(){
        var temp = GeoJson;
        var topo = topoServer.topology({foo: temp});
        topo = topoSimplify.presimplify(topo);
        topo = topoSimplify.simplify(topo, 0.05);
        temp = topoClient.feature(topo, topo.objects.foo);
        setGeoJson(temp);
        setKeyid(keyid => keyid+1)
    }

    const handleImport = () => {store.changeModal(CurrentModal.MAP_IMPORT)}
    const handleExport = () => {store.changeModal(CurrentModal.MAP_EXPORT)}

    const handleSave = () =>   {}

    const handlePublish = () => {
        fetch(process.env.REACT_APP_API_URL + 'map/publishMapById', {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log(data)
        })
        .catch(err => console.log(err));

    }

    const handleMapClassification = () => {store.changeModal(CurrentModal.MAP_CLASSIFICATION)}

    function handleUpdate(){
        setKeyid(keyid => keyid+1)
    }

    function handleChangeMapName(e){
        fetch(process.env.REACT_APP_API_URL + 'map/changeMapNameById', {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                newName: e.target.value
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("data of new name", data);
            setMapChange(data.name);
        })
        .catch(err => console.log(err));
    }

    function handleExportGeoJson(event) {
        store.changeModal("NONE");
        var json = JSON.stringify(GeoJson);

        var a = document.createElement("a")
        a.href = URL.createObjectURL(
            new Blob([json], {type:"application/json"})
        )
        a.download = "geoJson.geo.json"
        a.click()
    }

    async function handleExportShpDbf(event) {
        store.changeModal("NONE");  
    }

    const handleKeyPress = (e) => {
        console.log(e)
        if(e.key === 'z' && e.ctrlKey)
            store.jstps.undoTransaction()
        else if (e.key === 'y' && e.ctrlKey)
            store.jstps.doTransaction()
    }

    function handleChangeMapName(event) {
        // store.changeModal("NONE");

        fetch(process.env.REACT_APP_API_URL + 'map/changeMapNameById', {
            method: "POST",
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                newName: event.target.value
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("data of new name", data);
        })
        .catch(err => console.log(err));
    }
    function initGeojsonGraphicalData (geoJsonObj) {
        geoJsonObj.graphicalData ??= {}
        geoJsonObj.graphicalData.backgroundColor ??= "#FFFFFF"
        geoJsonObj.graphicalData.textBoxList ??= []
        geoJsonObj.graphicalData.legend ??= []
    }

    return (
        <div className="App" onKeyPress={handleKeyPress}>

            <ImportModal
                handleGeoJson={handleGeoJson}
                handleShpDbfFile={handleShpDbfFile}
                handleSubmit={handleSubmit}
            />
            <ExportModal
                handleExportGeoJson={handleExportGeoJson}
                handleExportShpDbf={handleExportShpDbf}
            />
            <MapClassificationModal id={id}/>
            <MapColorwheelModal/>
            <MapMergeChangeRegionNameModal/>
            <MapAddRegionModal/>


            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Box
                        sx={{
                            paddingLeft: "2%",
                            paddingTop: "1%",
                            maxWidth: '30%'}}>

            <InputGroup className="mb-3">
                <input type="text" className="form-control" 
                id="validationCustom01" value={mapName}
                onChange={e => {setMapChange(e.target.value)}}
                onBlur={handleChangeMapName}
                required
                style={{ fontSize: "2rem",fontWeight:"bold", border: "none"}}
                sx={{width:'20%'}}
                       />

            </InputGroup>
                    </Box>
                </Grid>
                <Box item xs={12} md={6} sx={{
                    paddingTop: "2%"
                }}>
                    <Grid container spacing={2} >
                        {Buttons(handleCompress, "Compress")}
                        {Buttons(handleImport, "Import")}
                        {Buttons(handleExport, "Export")}
                        {Buttons(handlePublish, "Publish")}
                        {Buttons(handleMapClassification, "Classification")}
                        {Buttons(handleSave, "Save")}
                        {Buttons(() => {
                            initGeojsonGraphicalData(na)
                            setGeoJson(na)

                        }, "Demo")}

                    </Grid>
                </Box>
                <Grid container spacing={2} item xs={11.5} md={9.5}>
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                paddingLeft: "1.5%"
                            }}>
                            <MapEditor  changeName={changeRegionName} key={keyid} handleCompress={handleCompress} updateViewer={handleUpdate} />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <MapLegendFooter />
                    </Grid>
                </Grid>
                <Grid item xs={2}  sx={{ display: { xs: 'block', md: 'none' } }} >
                
                </Grid>
                <Grid item xs={8} md={2.5}>
                    <MapPropertySidebar />
                </Grid>
                <Grid item xs={2} md={8}>
                
                </Grid>
            </Grid>
        </div>
    );
}

export default MapViewerScreen;