import { Component } from "react";
import { withRouter } from "react-router-dom";
import ReactHtmlParser from 'react-html-parser';

// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlassMinus, faPlay, faPause, faEye, faEyeSlash, faArrowRight, faArrowLeft, faExpand, faRotateRight } from "@fortawesome/free-solid-svg-icons";


// Import utils
import { checkIfProjectExists } from "../../Utils/utils";

// Import OpenSeaDragon and Annotorious
import "../../libraries/openseadragon/openseadragon-annotorious.min.js";

// Import CSS
import "./OpenView.css";


class OpenView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentID: -1,
            timer: false,
            intervalID: 0,
            fullScreenEnabled: false,
            isAnnotationsVisible: true
        }
    }

    componentDidMount() {
        // First of all, verify if the UUID match to an real project in the localStorage
        // If not, then redirect the user to the HomePage
        if (!this.props.match.params.id || !checkIfProjectExists(this.props.match.params.id)) {
            this.props.history.push("/")
        } else {
            let tileSources;
            if (this.props.selected_project.manifest_url) {

                tileSources = [
                    this.props.selected_project.manifest_url
                ]

            } else {
                tileSources = {
                    type: 'image',
                    url: this.props.selected_project.img_url
                }
            }

            this.openSeadragon = OpenSeadragon({
                id: 'adno-osd',
                homeButton: "home-button",
                showNavigator: this.props.showNavigator,
                tileSources: tileSources,
                prefixUrl: 'https://openseadragon.github.io/openseadragon/images/'
            })

            this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
                locale: 'auto',
                drawOnSingleClick: true,
                allowEmpty: true,
                disableEditor: true,
                readOnly: true
            });

            this.AdnoAnnotorious.on('clickAnnotation', (annotation, element) => {

                if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
                    document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
                }

                this.AdnoAnnotorious.fitBounds(annotation.id)

                let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

                this.setState({ currentID: annotationIndex })
                this.props.changeSelectedAnno(annotation)
            });


            // Generate dataURI and load annotations into Annotorious
            const dataURI = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(this.props.annos))));
            this.AdnoAnnotorious.loadAnnotations(dataURI)
        }


        addEventListener('fullscreenchange', (event) => {
            // turn off fullscreen
            if (!document.fullscreenElement) {
                this.setState({ fullScreenEnabled: false })
            }
        });

    }

    automateLoading = () => {
        let localCurrentID = this.state.currentID;



        if (this.state.currentID === -1) {
            localCurrentID = 0
        } else if (this.state.currentID === this.props.annos.length - 1) {
            localCurrentID = 0
        } else {
            localCurrentID++;
        }

        this.setState({ currentID: localCurrentID })

        this.changeAnno(this.props.annos[localCurrentID])
    }

    changeAnno = (annotation) => {
        this.props.changeSelectedAnno(annotation)

        this.AdnoAnnotorious.selectAnnotation(annotation.id)
        this.AdnoAnnotorious.fitBounds(annotation.id)

        let annotationIndex = this.props.annos.findIndex(anno => anno.id === annotation.id)

        this.setState({ currentID: annotationIndex })

        if (annotation.id && document.getElementById(`anno_card_${annotation.id}`)) {
            document.getElementById(`anno_card_${annotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    }


    startTimer = () => {
        // Check if the timer is already started, clear the auto scroll between annotations
        if (this.state.timer) {
            this.setState({ timer: false })

            clearInterval(this.state.intervalID)
        } else {

            if (this.props.startbyfirstanno) {
                this.setState({ currentID: -1 })

                this.changeAnno(this.props.annos[0])
            } else {
                this.automateLoading()

            }
            // Call the function to go to the next annotation every "timerDelay" seconds
            let interID = setInterval(this.automateLoading, this.props.timerDelay * 1000);
            this.setState({ timer: true, intervalID: interID })
        }
    }

    previousAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.props.annos.length > 0) {

            if (this.state.currentID === -1 || this.state.currentID === 0) {
                localCurrentID = this.props.annos.length - 1
            } else {
                localCurrentID = this.state.currentID - 1
            }

            this.setState({ currentID: localCurrentID })

            this.changeAnno(this.props.annos[localCurrentID])


            if (this.props.annos[localCurrentID].id && document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`)) {
                document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            }
        
        }
    }

    nextAnno = () => {
        let localCurrentID = this.state.currentID

        if (this.props.annos.length > 0) {

            if (this.state.currentID === -1 || this.state.currentID === this.props.annos.length - 1) {
                localCurrentID = 0
            } else {
                localCurrentID++;
            }

            this.setState({ currentID: localCurrentID })

            this.changeAnno(this.props.annos[localCurrentID])

            if (this.props.annos[localCurrentID].id && document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`)) {
                document.getElementById(`anno_card_${this.props.annos[localCurrentID].id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            }

        }
    }

    toggleFullScreen = () => {
        // turn on full screen
        if (!this.state.fullScreenEnabled) {
            document.getElementById("adno-osd").requestFullscreen();
            this.setState({ fullScreenEnabled: true })
        } else {
            document.exitFullscreen();
            this.setState({ fullScreenEnabled: false })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        // check when there is a new selected annotation from the sidebar
        if (prevProps.selectedAnno !== this.props.selectedAnno) {
            this.changeAnno(this.props.selectedAnno)
        }

        // Check if the user toggled the navigator on/off
        if (this.props.showNavigator !== prevProps.showNavigator) {
            if (this.props.showNavigator) {
                document.getElementById(this.openSeadragon.navigator.id).style.display = 'block';
            } else {
                document.getElementById(this.openSeadragon.navigator.id).style.display = 'none';
            }

        }
    }

    toggleAnnotationsLayer = () => {
        this.AdnoAnnotorious.setVisible(!this.state.isAnnotationsVisible)
        this.setState({isAnnotationsVisible: !this.state.isAnnotationsVisible})
    }

    render() {
        return (
            <div id="adno-osd">

                {
                    this.state.fullScreenEnabled && this.props.selectedAnno && this.props.selectedAnno.body &&
                    <div className={this.props.toolsbarOnFs ? "adno-osd-anno-fullscreen-tb-opened" : "adno-osd-anno-fullscreen"}>
                        {this.props.selectedAnno.body && this.props.selectedAnno.body[0] &&
                            this.props.selectedAnno.body[0].value
                            ? ReactHtmlParser(this.props.selectedAnno.body[0].value) : "Annotation vide"}
                    </div>
                }


                <div className={this.state.fullScreenEnabled && this.props.toolsbarOnFs ? "osd-buttons-bar" : this.state.fullScreenEnabled && !this.props.toolsbarOnFs ? "osd-buttons-bar-hidden" : "osd-buttons-bar"}>
                    <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.startTimer()}><FontAwesomeIcon icon={this.state.timer ? faPause : faPlay} size="lg"/></button>
                    <button id="home-button" className="toolbarButton toolbaractive"><FontAwesomeIcon icon={faMagnifyingGlassMinus} size="lg"/></button>
                    <button id="set-visible" className="toolbarButton toolbaractive" onClick={() => this.toggleAnnotationsLayer()}><FontAwesomeIcon icon={this.state.isAnnotationsVisible ? faEyeSlash : faEye} size="lg"/></button>
                    <button id="previousAnno" className="toolbarButton toolbaractive" onClick={() => this.previousAnno()}><FontAwesomeIcon icon={faArrowLeft} size="lg"/></button>
                    <button id="nextAnno" className="toolbarButton toolbaractive" onClick={() => this.nextAnno()}><FontAwesomeIcon icon={faArrowRight} size="lg"/></button>
                    <button id="rotate" className="toolbarButton toolbaractive" onClick={() => this.openSeadragon.viewport.setRotation(this.openSeadragon.viewport.degrees  + 90 )}><FontAwesomeIcon icon={faRotateRight} size="lg"/></button>
                    <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}><FontAwesomeIcon icon={faExpand} size="lg"/></button>
                </div>
            </div>
        )
    }
}

export default withRouter(OpenView);