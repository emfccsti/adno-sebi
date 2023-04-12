import { Component } from "react";
import { withRouter } from "react-router";

// Import Html Parser
import ReactHtmlParser from 'react-html-parser';

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faDownLong, faEdit, faTrashAlt, faUpLong } from "@fortawesome/free-solid-svg-icons";

// Import SweetAlert
import Swal from "sweetalert2";

// Import Utils 
import { buildTagsList, generateUUID, insertInLS } from "../../../Utils/utils";

//Imports CSS
import "./AnnotationCards.css";

// Add translations
import { withTranslation } from "react-i18next";

class AnnotationCards extends Component {
    constructor(props) {
        super(props);
    }

    getAnnotationHTMLBody = (annotation) => {
        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) && annotation.body.find(annoBody => annoBody.type === "HTMLBody") && annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return ReactHtmlParser(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)
            } else {
                return ReactHtmlParser(`<span class="no-content">Ø ${this.props.t('annotation.no_content')}</span>`)
            }
        } else {
            return ReactHtmlParser(`<span class="no-content">Ø ${this.props.t('annotation.no_content')}</span>`)
        }
    }

    render() {
        // Function to move an annotation up one place
        const annoSwitchUp = (index) => {

            var annos = this.props.annotations;

            var annoToSwitch = annos[index - 1]

            annos[index - 1] = annos[index]
            annos[index] = annoToSwitch

            insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

            this.props.updateAnnos(annos)
        }

        // Function to move an annotation down one place
        const annoSwitchDown = (index) => {
            var annos = this.props.annotations;

            var annoToSwitch = annos[index + 1]

            annos[index + 1] = annos[index]
            annos[index] = annoToSwitch

            insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos))

            this.props.updateAnnos(annos)
        }

        // Function to delete an annotation
        const deleteAnnotation = (annotationID) => {

            Swal.fire({
                title: this.props.t('modal.ask_delete'),
                showCancelButton: true,
                confirmButtonText:this.props.t('modal.confirm_del_annotation'),
                cancelButtonText: 'Annuler',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    var annos = this.props.annotations;

                    // Update the localStorage without the removed item
                    insertInLS(`${this.props.match.params.id}_annotations`, JSON.stringify(annos.filter(annotation => annotation.id != annotationID)))

                    Swal.fire(this.props.t('modal.del_annotation_confirmation'), '', 'success')
                        .then((result) => {
                            if (result.isConfirmed) {
                                this.props.updateAnnos(annos.filter(annotation => annotation.id != annotationID))
                            }
                        })
                }
            })
        }

        return (
            <div className="annotations_list">
                {
                    this.props.annotations.map((annotation, index) => {
                        return (
                            <div id={`anno_edit_card_${annotation.id}`} className={this.props.selectedAnno && this.props.selectedAnno.id === annotation.id ? "anno-card selectedAnno shadow" : "anno-card shadow"} key={`anno_edit_card_${annotation.id}`}>
                                <div className="anno-card-body">

                                    <div className="card-tags-list">
                                        {
                                            buildTagsList(annotation).map(tag => {
                                                return (
                                                    <div key={generateUUID()} className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                                                        {tag.value}
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>

                                    <div className="adno-card-body">
                                        {this.getAnnotationHTMLBody(annotation)}
                                    </div>

                                    <div className="btn-line-one-card">
                                        <button className="btn btn-sm" onClick={() => this.props.openRichEditor(annotation)}> <FontAwesomeIcon icon={faEdit} /></button>
                                        <button type="button"
                                            onClick={() => this.props.changeSelectedAnno(annotation)}
                                            className="btn btn-sm btn-show-more"> <FontAwesomeIcon icon={faBullseye} /></button>
                                        {index < this.props.annotations.length - 1 ? <button className="btn btn-sm btn-outline" onClick={() => annoSwitchDown(index)}> <FontAwesomeIcon icon={faDownLong} /> </button> : <></>}
                                        {index > 0 ? <button className="btn btn-sm" onClick={() => annoSwitchUp(index)}> <FontAwesomeIcon icon={faUpLong} /> </button> : <></>}
                                        <button className="btn btn-sm btn-outline btn-error" onClick={() => deleteAnnotation(annotation.id)}> <FontAwesomeIcon icon={faTrashAlt} /></button>
                                    </div>
                                </div >
                            </div >
                        )
                    })
                }
            </div>
        )
    }
}
export default withTranslation()(withRouter(AnnotationCards));