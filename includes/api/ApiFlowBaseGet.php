<?php

use Flow\Block\AbstractBlock;
use Flow\Model\Anchor;

abstract class ApiFlowBaseGet extends ApiFlowBase {
	public function execute() {
		$loader = $this->getLoader();
		$blocks = $loader->createBlocks();
		$context = $this->getContext();
		$action = $this->getAction();
		$passedParams = $this->getBlockParams();

		$output = array( $action => array(
			'result' => array(),
			'status' => 'ok',
		) );

		/** @var AbstractBlock $block */
		foreach( $blocks as $block ) {
			$block->init( $context, $action );

			if ( $block->canRender( $action ) ) {
				$blockParams = array();
				if ( isset( $passedParams[$block->getName()] ) ) {
					$blockParams = $passedParams[$block->getName()];
				}

				$output[$action]['result'][$block->getName()] = $block->renderAPI( $blockParams );
			}
		}

		// See if any of the blocks generated an error (in which case the
		// request will terminate with an the error message)
		$this->processError( $blocks );

		// If nothing could render, we'll consider that an error (at least some
		// block should've been able to render a GET request)
		if ( !$output[$action]['result'] ) {
			$this->getResult()->dieUsage(
				wfMessage( 'flow-error-no-render' )->parse(),
				'no-render',
				200,
				array()
			);
		}

		$blocks = array_keys($output[$action]['result']);
		$this->getResult()->setIndexedTagName( $blocks, 'block' );

		// Required until php5.4 which has the JsonSerializable interface
		array_walk_recursive( $output, function( &$value ) {
			if ( $value instanceof Anchor ) {
				$value = $value->toArray();
			} elseif ( $value instanceof Message ) {
				$value = $value->text();
			}
		} );

		$this->getResult()->addValue( null, $this->apiFlow->getModuleName(), $output );
	}

	/**
	 * {@inheritDoc}
	 */
	public function mustBePosted() {
		return false;
	}

	/**
	 * {@inheritDoc}
	 */
	public function needsToken() {
		return false;
	}

	/**
	 * {@inheritDoc}
	 */
	public function getTokenSalt() {
		return false;
	}
}
