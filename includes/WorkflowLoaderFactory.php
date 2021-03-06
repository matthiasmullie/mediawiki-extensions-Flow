<?php

namespace Flow;

use Flow\Model\UUID;
use Flow\Model\Workflow;
use Flow\Data\ManagerGroup;
use Flow\Exception\CrossWikiException;
use Flow\Exception\InvalidInputException;
use Flow\Exception\InvalidDataException;
use Title;

class WorkflowLoaderFactory {
	/**
	 * @var ManagerGroup
	 */
	protected $storage;

	/**
	 * @var BlockFactory
	 */
	protected $blockFactory;

	/**
	 * @var SubmissionHandler
	 */
	protected $submissionHandler;

	/**
	 * @var string
	 */
	protected $defaultWorkflowName;

	/**
	 * @param ManagerGroup $storage
	 * @param BlockFactory $blockFactory
	 * @param SubmissionHandler $submissionHandler
	 * @param string $defaultWorkflowName
	 */
	function __construct(
		ManagerGroup $storage,
		BlockFactory $blockFactory,
		SubmissionHandler $submissionHandler,
		$defaultWorkflowName
	) {
		$this->storage = $storage;
		$this->blockFactory = $blockFactory;
		$this->submissionHandler = $submissionHandler;
		$this->defaultWorkflowName = $defaultWorkflowName;
	}

	/**
	 * @param Title $pageTitle
	 * @param UUID|null $workflowId
	 * @return WorkflowLoader
	 * @throws InvalidInputException
	 * @throws CrossWikiException
	 */
	public function createWorkflowLoader( Title $pageTitle, $workflowId = null ) {
		if ( $pageTitle === null ) {
			throw new InvalidInputException( 'Invalid article requested', 'invalid-title' );
		}

		if ( $pageTitle && $pageTitle->isExternal() ) {
			throw new CrossWikiException( 'Interwiki to ' . $pageTitle->getInterwiki() . ' not implemented ', 'default' );
		}

		if ( $pageTitle->getNamespace() === NS_TOPIC ) {
			$workflowId = self::uuidFromTitle( $pageTitle );
		}
		if ( $workflowId !== null ) {
			$workflow = $this->loadWorkflowById( $pageTitle, $workflowId );
		} else {
			$workflow = $this->loadWorkflow( $pageTitle );
		}

		return new WorkflowLoader(
			$workflow,
			$this->blockFactory,
			$this->submissionHandler
		);
	}

	/**
	 * @param Title $title
	 * @return Workflow
	 * @throws InvalidDataException
	 */
	protected function loadWorkflow( \Title $title ) {
		global $wgUser;
		$storage = $this->storage->getStorage( 'Workflow' );

		$found = $storage->find( array(
			'workflow_type' => $this->defaultWorkflowName,
			'workflow_wiki' => $title->isLocal() ? wfWikiId() : $title->getTransWikiID(),
			'workflow_namespace' => $title->getNamespace(),
			'workflow_title_text' => $title->getDBkey(),
		) );
		if ( $found ) {
			$workflow = reset( $found );
		} else {
			$workflow = Workflow::create( $this->defaultWorkflowName, $wgUser, $title );
		}

		return $workflow;
	}

	/**
	 * @param Title|false $title
	 * @param UUID $workflowId
	 * @return Workflow
	 * @throws InvalidInputException
	 */
	protected function loadWorkflowById( /* Title or false */ $title, $workflowId ) {
		/** @var Workflow $workflow */
		$workflow = $this->storage->getStorage( 'Workflow' )->get( $workflowId );
		if ( !$workflow ) {
			throw new InvalidInputException( 'Invalid workflow requested by id', 'invalid-input' );
		}
		if ( $title !== false && !$workflow->matchesTitle( $title ) ) {
			throw new InvalidInputException( 'Flow workflow is for different page', 'invalid-input' );
		}

		return $workflow;
	}

	/**
	 * Create a UUID for a Title object
	 *
	 * @param Title $title
	 * @return UUID
	 * @throws InvalidInputException When the Title does not represent a valid uuid
	 */
	public static function uuidFromTitle( Title $title ) {
		return self::uuidFromTitlePair( $title->getNamespace(), $title->getDbKey() );
	}

	/**
	 * Create a UUID for a ns/dbkey title pair
	 *
	 * @param integer $ns
	 * @param string $dbKey
	 * @return UUID
	 * @throws InvalidInputException When the pair does not represent a valid uuid
	 */
	public static function uuidFromTitlePair( $ns, $dbKey ) {
		if ( $ns !== NS_TOPIC ) {
			throw new InvalidInputException( "Title is not from NS_TOPIC: $ns", 'invalid-input' );
		}

		return UUID::create( strtolower( $dbKey ) );
	}
}
