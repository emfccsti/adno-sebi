import { Component } from 'react';

// Import FontAwesome
import { faCheckCircle, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import tags input
import { TagsInput } from 'react-tag-input-component';

// Import Markdown editor
import { insertInLS } from '../../Utils/utils';

// Import CSS
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import { withTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

class AdnoMdEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDeleting: false,
            selectedTags: this.props.selectedAnnotation.body && this.props.selectedAnnotation.body.length > 0 && this.props.selectedAnnotation.body.filter(anno => anno.purpose === "tagging").reduce((a, b) => [...a, b.value], []) || [],
            markdown: [],
            selectedTags: []
        }
    }

    editorRef = React.createRef();

    saveMD = () => {
        let annos = [...this.props.annotations];
        let currentSelectedAnno = { ...this.props.selectedAnnotation };

        let md = this.editorRef.current.getInstance().getMarkdown();

        // Check if something has been wrote down
        let html = this.editorRef.current.getInstance().getMarkdown() ? this.editorRef.current.getInstance().getHTML() : "";

        let newTextBody = {
            "type": "TextualBody",
            "value": md,
            "purpose": "commenting"
        }

        let HTMLBody = {
            "type": "HTMLBody",
            "value": html,
            "purpose": "commenting"
        }

        let tags = this.state.selectedTags.map(tag => {
            return (
                {
                    "type": "TextualBody",
                    "value": tag,
                    "purpose": "tagging"
                }
            )
        })

        let newBody = [newTextBody, HTMLBody, ...tags]
        currentSelectedAnno.body = newBody;

        if (annos.find(anno => anno.id === currentSelectedAnno.id)) {
            const idx = annos.findIndex(anno => anno.id === currentSelectedAnno.id);
            annos[idx] = currentSelectedAnno;
        } else {
            Swal.fire({
                title: this.props.t('errors.error_found'),
                showCancelButton: false,
                confirmButtonText: 'Ok',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    this.props.closeMdEditor()
                }
            })
        }

        insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos))
        this.props.updateAnnos(annos)

        document.getElementById(`anno_edit_card_${this.props.selectedAnnotation.id}`).scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

        this.props.closeMdEditor()
    }

    getAnnoBody = () => {
        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            return this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0] ? this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0].value : ""
        } else {
            return ""
        }
    }

    deleteAnnotation = () => {
        this.setState({ isDeleting: false })

        var annotationID = this.props.selectedAnnotation.id
        var annos = [...this.props.annotations];

        if (annos.find(anno => anno.id === annotationID)) {
            annos = annos.filter(annotation => annotation.id !== annotationID)

            // Update the localStorage without the removed item
            insertInLS(`${this.props.selectedProjectId}_annotations`, JSON.stringify(annos.filter(annotation => annotation.id != annotationID)))

            // Update the state of the main component
            this.props.updateAnnos(annos)

            // Close the editor window
            this.props.closeMdEditor()
        } else {
            Swal.fire({
                title: this.props.t('errors.error_found'),
                showCancelButton: false,
                confirmButtonText: 'Ok',
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    // Close the editor window
                    this.props.closeMdEditor()
                }
            })
        }
    }


    render() {

        // $$openstreetmap 46.6696162,0.3549242$$

        // const openStreetMapPlugin = () => {
        //     const toHTMLRenderers = {
        //         openstreetmap(node) {
        //             console.log(node.firstChild.literal);
        //             // return {
        //             //     type: 'text',
        //             //     content: node.firstChild.literal,
        //             //     classNames: [`adnomap-${generateUUID}`]
        //             // };

        //             return [
        //                 { type: 'openTag', outerNewLine: true},
        //                 { type: 'html', content: node.firstChild.literal },
        //                 { type: 'closeTag', outerNewLine: true },
        //             ]
        //         },
        //     }

        //     return { toHTMLRenderers }
        // }



        return (
            <div className="card w-96 bg-base-100 shadow-xl rich-card-editor">
                <div className="card-body">
                    <div className="card-actions justify-end">
                        <button className="btn btn-square btn-sm" onClick={() => this.props.closeMdEditor()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>


                    <Editor
                        initialValue={this.getAnnoBody()}
                        previewStyle="vertical"
                        height="600px"
                        initialEditType="markdown"
                        ref={this.editorRef}
                        usageStatistics={false}
                        previewStyle="tab"
                        initialEditType="markdown"
                        placeholder="Ajoutez votre texte ici"
                        hideModeSwitch={true}
                        // plugins= {[openStreetMapPlugin]}

                        toolbarItems={[
                            [
                                'heading',
                                'italic',
                                'bold',
                                'ul',
                                'link',
                                'image',
                                // {
                                //     name: 'Map',
                                //     tooltip: 'openstreetmap',
                                //     command: 'bold',
                                //     text: '@',
                                //     className: 'toastui-editor-toolbar-icons',
                                //     style: { backgroundImage: 'none', color: 'black' }
                                // },
                                // {
                                //     name: 'Wikidata',
                                //     tooltip: 'wikidata',
                                //     command: 'bold',
                                //     text: '@',
                                //     className: 'toastui-editor-toolbar-icons',
                                //     style: { backgroundImage: 'none', color: 'black' }
                                // }
                            ]
                        ]}


                    />

                    <div id="editor"></div>

                    <div className="editor-tags">
                        <TagsInput
                            value={this.state.selectedTags}
                            onChange={(tags) => this.setState({ selectedTags: tags })}
                            placeHolder={this.props.t('editor.md_add_tag')}
                        />
                    </div>


                    <div className="rich-card-editor-btns">
                        <button className="btn ml-1 mr-1" onClick={() => this.saveMD()}><FontAwesomeIcon icon={faSave} /> &nbsp; {this.props.t('editor.md_save')} </button>
                        {!this.state.isDeleting && <button className="btn btn-error ml-1 mr-1" onClick={() => this.setState({ isDeleting: true })}> <FontAwesomeIcon icon={faTrash} /> &nbsp; {this.props.t('editor.md_delete')} </button>}
                        {this.state.isDeleting && <button className="btn btn-success" onClick={() => this.deleteAnnotation()}> <FontAwesomeIcon icon={faCheckCircle} /> &nbsp;  {this.props.t('editor.md_delete_confirm')} </button>}
                    </div>

                </div>
            </div>

        )
    }
}
export default withTranslation()(AdnoMdEditor);