import Button from '@mui/material/Button';
import MapEditor from './MapEditor';
import * as shapefile from "shapefile";
import na from './na.json'
import React, {useContext, useEffect, useState} from 'react';
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MapPropertySidebar from "./MapPropertySidebar";
import {CurrentModal, GlobalStoreContext, GlobalStoreContextProvider} from "../../store";
import ExportModal from "./MapViewerModal/ExportModal";
import MapClassificationModal from "./MapViewerModal/MapClassificationModal";
import MapColorwheelModal from "./MapViewerModal/MapColorwheelModal";
import MapMergeChangeRegionNameModal from "./MapViewerModal/MapMergeChangeRegionNameModal";
import {FormControl, InputAdornment} from "@mui/material";
import {Input} from "@mui/icons-material";
import ImportModal from "./MapViewerModal/ImportModal";
import MapLegendFooter from "./MapLegendFooter";
import {useParams} from 'react-router-dom';
import Box from "@mui/material/Box";

function MapViewerScreen(){

    const [fileExist, setFileExist] = useState(false);
    const [GeoJson, setGeoJson] = useState({});
    const [state, setState] = useState(true);
    const [data, setData] = useState([]);
    const [mapName,setMapChange] = useState("Untitled");

    const { store } = useContext(GlobalStoreContext);
    const { id } = useParams();

    const names = [];
    let count = 0;
    let shpfile = null;
    let dbffile = null;

    useEffect(() => {
        upload();
        console.log("map id", id);

        if (id !== undefined) {
            fetch("http://localhost:9000/" + 'user/loggedIn', {
                method: "GET",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: id }),
                })
                .then((res) => res.json())
                .then((data) => {
                    console.log("map data", data);
                })
                .catch(err => console.log(err)
            );
        }
    },[])


    const readShapefile = (e) => {
        count = 0;
        //can only upload shp file but not zip file for now
        let res = [];
        let empty = {}
        empty.type = "FeatureCollection"
        empty.features = res
        shapefile
            .open(
                e,
                null
            ).then(function (e){
            e.read().then(
                function next(result){
                    if(result.value)
                    {
                        result.value.properties.name = names[count];
                        count++;
                        // console.log(result.value);
                        empty.features.push(result.value)
                    }
                    if(!result.done){
                        e.read().then(next)
                    }
                    else{
                        setGeoJson(empty)
                        setFileExist(true);
                    }
                })
        })
    }

    const readShapefile2 = (e) => {
        count = 0;
        //can only upload shp file but not zip file for now

        shapefile
            .openDbf(
                e,
                //"https://cdn.rawgit.com/mbostock/shapefile/master/test/points.shp",
                null
            ).then(function (e){
            e.read().then(
                function next(result){
                    // console.log(result)
                    if(result.value)
                    {
                        if(result.value.NAME_3)
                            names[count]=result.value.NAME_3;
                        else if(result.value.NAME_2)
                            names[count]=result.value.NAME_2;
                        else if(result.value.NAME_1)
                            names[count]=result.value.NAME_1;
                        else if(result.value.NAME_0)
                            names[count]=result.value.NAME_0;
                        count++;
                    }
                    if(!result.done){
                        e.read().then(next)
                    }
                    else{
                        console.log("done with name")
                        console.log(names);
                    }
                })
        })
    }

    const handleSubmit = (e) => {
        {
            if (shpfile != null && dbffile != null){
                const reader = new FileReader();
                setGeoJson({});
                reader.readAsArrayBuffer(shpfile);
                reader.onload = async e => {
                    await readShapefile(reader.result)
                }
                // console.log("shp file read");
            }
        }
    }

    const handleSelectFile = (e) => {
        {
            shpfile = e.target.files[0];

            // console.log("shp file read");
        }
    }
    const handleSelectFile2 = (e) => {
        {
            dbffile = e.target.files[0];
            //this is for shapefile
            const reader = new FileReader();

            reader.readAsArrayBuffer(e.target.files[0]);
            reader.onload = async e => {
                await readShapefile2(reader.result)
            }
            // console.log("dbf file read");
        }
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
        setState(!state);
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
                    sx={{
                        width: "100%"
                    }}
                    variant="contained"
                    onClick={Function}
                >
                    {Text}
                </Button>
            </Grid>

        return wrappedButton
    }

    const handleCompress = () => {}
    const handleImport = () => {store.changeModal(CurrentModal.MAP_IMPORT)}
    const handleExport = () => {store.changeModal(CurrentModal.MAP_EXPORT)}
    const handleSave = () =>   {}
    const handlePublish = () => {}
    const handleMapClassification = () => {store.changeModal(CurrentModal.MAP_CLASSIFICATION)}




    return (
        <div className="App">

            <ImportModal/>
            <ExportModal/>
            <MapClassificationModal/>
            <MapColorwheelModal/>
            <MapMergeChangeRegionNameModal/>

            {/*<div>*/}
            {/*    Shapefile:*/}
            {/*    <input type="file" accept="geo.json" onChange={handleSelectFile}/>*/}
            {/*</div>*/}
            {/*<div>*/}
            {/*    Dbf:*/}
            {/*    <input type="file" accept="geo.json" onChange={handleSelectFile2}/>*/}
            {/*</div>*/}
            {/*<div> <input type="submit" value="submit" onClick={handleSubmit} /></div>*/}

            <Grid container spacing={2}>
                <Grid item xs={4}
                >

                    <Box
                        sx={{
                            paddingLeft: "2%",
                            paddingTop: "1%",
                            maxWidth: '100%'}}>
                        <TextField
                            sx={{
                                fontSize: 100
                            }}
                            defaultValue={mapName}
                            hiddenLabel
                            variant="standard"


                            InputProps={{
                                style: {fontSize: 40},
                                disableUnderline: true
                            }}
                            onChange={
                                (event)=>{
                                    console.log("searching...", event.target.value);
                                    setMapChange(event.target.value)}}
                            fullWidth  />
                    </Box>

                </Grid>

                <Box item xs={8} sx={{
                    paddingTop: "2%"
                }}>
                <Grid container spacing={2} >
                        {Buttons(handleCompress, "Compress")}
                        {Buttons(handleImport, "Import")}
                        {Buttons(handleExport, "Export")}
                        {Buttons(handlePublish, "Publish")}
                        {Buttons(handleSave, "Save")}
                        {Buttons(handleMapClassification, "Classification")}
                    </Grid>
                </Box>

                <Grid item xs={9}>
                    <Box
                        sx={{
                            paddingLeft: "1.5%"
                        }}>
                        <MapEditor file={GeoJson} changeName={changeRegionName}/>

                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <MapPropertySidebar file={GeoJson}/>
                </Grid>

                <Grid item xs={8}>
                    <MapLegendFooter file={GeoJson}/>
                </Grid>
            </Grid>


            <Grid container spacing={2}>

            </Grid>



        </div>
    );
}

export default MapViewerScreen;