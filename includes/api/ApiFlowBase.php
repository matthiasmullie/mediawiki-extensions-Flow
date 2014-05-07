<?php

use Flow\WorkflowLoader;
use Flow\Model\UUID;
use Flow\Container;
use Flow\TalkpageManager;
use Flow\Block\AbstractBlock;
use Flow\Model\AbstractRevision;

abstract class ApiFlowBase extends ApiBase {

	/** @var WorkflowLoader $loader */
	protected $loader;

	/** @var Title|bool $page */
	protected $page;

	/** @var UUID|null $id */
	protected $id;

	/** @var bool $render */
	protected $render;

	/** @var ApiFlow $apiFlow */
	protected $apiFlow;

	/**
	 * @param ApiFlow $api
	 * @param string $modName
	 * @param string $prefix
	 */
	public function __construct( $api, $modName, $prefix = '' ) {
		$this->apiFlow = $api;
		parent::__construct( $api->getMain(), $modName, $prefix );
	}

	/**
	 * Allows the main ApiFlow instance to set default parameters
	 *
	 * @param Title|bool $page
	 * @param UUID|null $workflow
	 */
	public function setWorkflowParams( $page, $workflow ) {
		$this->page = $page;
		$this->id = $workflow;
	}

	public function doRender( $do = null ) {
		return wfSetVar( $this->render, $do );
	}

	/*
	 * Return the name of the flow action
	 * @return string
	 */
	abstract protected function getAction();

	/**
	 * @return Container
	 */
	protected function getContainer() {
		return Container::getContainer();
	}

	/**
	 * @return WorkflowLoader
	 */
	protected function getLoader() {
		if ( $this->loader === null ) {
			$container = $this->getContainer();
			$this->loader = $container['factory.loader.workflow']
				->createWorkflowLoader( $this->page, $this->id );
		}

		return $this->loader;
	}

	/**
	 * @return TalkpageManager
	 */
	protected function getOccupationController() {
		$container = $this->getContainer();
		return $container['occupation_controller'];
	}

	/**
	 * The block names for an actions.  An action may invoke multiple blocks
	 * @return array
	 */
	abstract protected function getBlockNames();

	/**
	 * @return DerivativeRequest
	 */
	protected function getModifiedRequest() {
		$extracted = $this->extractRequestParams();
		// @fixme this is terrible, but we'll fix the interface later
		$params = array();
		foreach ( $this->getBlockNames() as $block ) {
			$params[$block] = $extracted;
		}

		return new DerivativeRequest(
			$this->getRequest(),
			$params,
			$this->getRequest()->wasPosted() // Note that we also enforce this at the API level.
		);
	}

	/**
	 * @return array
	 */
	protected function getModerationStates() {
		return array(
			AbstractRevision::MODERATED_DELETED,
			AbstractRevision::MODERATED_HIDDEN,
			AbstractRevision::MODERATED_SUPPRESSED,
			'restore', // @todo Does this need a constant?
		);
	}

	public function getHelpUrls() {
		return array(
			'https://www.mediawiki.org/wiki/Extension:Flow/API#' . $this->getAction(),
		);
	}

	public function getTokenSalt() {
		return '';
	}
}
